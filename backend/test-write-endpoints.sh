#!/bin/bash
# Plindo Backend Write-Endpoint Test Script
# Tests all POST/PUT/PATCH/DELETE endpoints + full slot booking flow
# Usage: bash test-write-endpoints.sh

BASE="http://localhost:5001/api"
PASS=0
FAIL=0

check() {
  local label="$1"
  local response="$2"
  local expected="$3"
  if echo "$response" | grep -q "$expected"; then
    echo "  ✅ $label"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label — got: $(echo "$response" | head -c 150)"
    FAIL=$((FAIL + 1))
  fi
}

# Get tokens
ADMIN_RESP=$(curl -s -X POST "$BASE/auth/unified-signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plindo.com","password":"admin123"}')
TOKEN=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
ADMIN_ID=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)

PARTNER_RESP=$(curl -s -X POST "$BASE/auth/unified-signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"partner@plindo.com","password":"partner123"}')
PTOKEN=$(echo "$PARTNER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
PARTNER_ID=$(echo "$PARTNER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['partner']['id'])" 2>/dev/null)

echo "Admin token: ${TOKEN:0:30}..."
echo "Partner ID: $PARTNER_ID"
echo ""

echo "=== 1. PARTNER AVAILABILITY (Read + Write) ==="
R=$(curl -s "$BASE/partner/availability/weekly" -H "Authorization: Bearer $PTOKEN")
check "GET /partner/availability/weekly" "$R" '"schedule"'

R=$(curl -s -X PUT "$BASE/partner/availability/weekly" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{
    "schedule": [
      {"dayOfWeek":0,"dayName":"Sunday","isEnabled":false,"timeBlocks":[]},
      {"dayOfWeek":1,"dayName":"Monday","isEnabled":true,"timeBlocks":[{"start":"08:00","end":"17:00"}]},
      {"dayOfWeek":2,"dayName":"Tuesday","isEnabled":true,"timeBlocks":[{"start":"08:00","end":"17:00"}]},
      {"dayOfWeek":3,"dayName":"Wednesday","isEnabled":true,"timeBlocks":[{"start":"08:00","end":"17:00"}]},
      {"dayOfWeek":4,"dayName":"Thursday","isEnabled":true,"timeBlocks":[{"start":"08:00","end":"17:00"}]},
      {"dayOfWeek":5,"dayName":"Friday","isEnabled":true,"timeBlocks":[{"start":"08:00","end":"17:00"}]},
      {"dayOfWeek":6,"dayName":"Saturday","isEnabled":true,"timeBlocks":[{"start":"09:00","end":"13:00"}]}
    ],
    "bufferTimeMinutes": 10,
    "maxAdvanceBookingDays": 21
  }')
check "PUT /partner/availability/weekly" "$R" '"schedule"'

echo ""
echo "=== 2. PARTNER CAPACITY (Read + Write) ==="
R=$(curl -s "$BASE/partner/capacity" -H "Authorization: Bearer $PTOKEN")
check "GET /partner/capacity" "$R" '"bays"'

R=$(curl -s -X PUT "$BASE/partner/capacity" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{"capacityByCategory":{"wash":4,"detailing":2,"other":0},"bufferTimeMinutes":20}')
check "PUT /partner/capacity" "$R" '"capacityByCategory"'

echo ""
echo "=== 3. PARTNER SERVICE CRUD ==="
CREATE_SVC=$(curl -s -X POST "$BASE/partner/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{
    "name":"Premium Interior Clean",
    "description":"Full interior detail",
    "serviceCategory":"detailing",
    "serviceType":"book_me",
    "duration":120,
    "bodyTypePricing":[
      {"bodyType":"Hatchback","price":45},
      {"bodyType":"Sedan","price":55},
      {"bodyType":"SUV","price":65}
    ],
    "status":"active"
  }')
check "POST /partner/services (create)" "$CREATE_SVC" '"status":0'
SVC_ID=$(echo "$CREATE_SVC" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('service',{}).get('_id','') or d.get('id',''))" 2>/dev/null)
echo "  Service ID: $SVC_ID"

if [ -n "$SVC_ID" ]; then
  R=$(curl -s "$BASE/partner/services/$SVC_ID" -H "Authorization: Bearer $PTOKEN")
  check "GET /partner/services/:id" "$R" '"status":0'

  R=$(curl -s -X PUT "$BASE/partner/services/$SVC_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"name":"Premium Interior Clean - Updated","duration":90}')
  check "PUT /partner/services/:id (update)" "$R" '"status":0'

  R=$(curl -s -X PATCH "$BASE/partner/services/$SVC_ID/toggle" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"status":"inactive"}')
  check "PATCH /partner/services/:id/toggle" "$R" '"status":0'

  # Reactivate for booking test
  curl -s -X PATCH "$BASE/partner/services/$SVC_ID/toggle" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"status":"active"}' > /dev/null
fi

echo ""
echo "=== 4. SLOT BOOKING FLOW ==="

echo "  -- Seeding a test customer via node --"
CUST_ID=$(node /Users/mac/Downloads/PLINDO-Admin-Panel/backend/seed-test-data.mjs 2>/dev/null)
echo "  Customer ID: $CUST_ID"

echo "  -- Getting available slots --"
SLOTS=$(curl -s "$BASE/bookings/slots?partnerId=$PARTNER_ID&date=2026-03-16&serviceCategory=detailing&duration=120" \
  -H "Authorization: Bearer $TOKEN")
check "GET /bookings/slots (with partner + date)" "$SLOTS" '"date"'

echo "  -- Calculate price --"
if [ -n "$SVC_ID" ]; then
  PRICE=$(curl -s -X POST "$BASE/bookings/calculate-price" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"serviceId\":\"$SVC_ID\",\"carType\":\"suv\"}")
  check "POST /bookings/calculate-price (with serviceId)" "$PRICE" '"basePrice"'
fi

echo "  -- Create slot booking --"
if [ -n "$CUST_ID" ] && [ -n "$SVC_ID" ]; then
  BOOKING=$(curl -s -X POST "$BASE/bookings/slot" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"partnerId\":\"$PARTNER_ID\",
      \"customerId\":\"$CUST_ID\",
      \"serviceId\":\"$SVC_ID\",
      \"serviceCategory\":\"detailing\",
      \"serviceType\":\"book_me\",
      \"carType\":\"suv\",
      \"slot\":{\"date\":\"2026-03-16\",\"startTime\":\"10:00\",\"endTime\":\"12:00\"}
    }")
  check "POST /bookings/slot (create booking)" "$BOOKING" '"bookingNumber"'
  BOOKING_ID=$(echo "$BOOKING" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  echo "  Booking ID: $BOOKING_ID"

  if [ -n "$BOOKING_ID" ]; then
    R=$(curl -s "$BASE/bookings/slot/$BOOKING_ID" -H "Authorization: Bearer $TOKEN")
    check "GET /bookings/slot/:id" "$R" '"bookingNumber"'

    R=$(curl -s -X PATCH "$BASE/bookings/$BOOKING_ID/status" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"status":"in_progress"}')
    check "PATCH /bookings/:id/status (→ in_progress)" "$R" '"status":0'

    R=$(curl -s -X POST "$BASE/bookings/$BOOKING_ID/reschedule" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"newSlot":{"date":"2026-03-17","startTime":"14:00","endTime":"16:00"},"rescheduledBy":"partner"}')
    check "POST /bookings/:id/reschedule" "$R" '"status":0'

    R=$(curl -s -X PATCH "$BASE/bookings/$BOOKING_ID/status" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"status":"completed"}')
    check "PATCH /bookings/:id/status (→ completed)" "$R" '"status":0'
  fi
else
  echo "  ⚠️  Skipping booking creation — no customer/service ID available"
fi

echo ""
echo "=== 5. PARTNER BOOKINGS ==="
R=$(curl -s "$BASE/partner/bookings?status=all" -H "Authorization: Bearer $PTOKEN")
check "GET /partner/bookings (partner portal)" "$R" '"status":0'

R=$(curl -s "$BASE/partner/bookings/timeline" -H "Authorization: Bearer $PTOKEN")
check "GET /partner/bookings/timeline" "$R" '"days"'

echo ""
echo "=== 6. ADMIN BOOKINGS ==="
R=$(curl -s "$BASE/admin/bookings?page=1&limit=10" -H "Authorization: Bearer $TOKEN")
check "GET /admin/bookings (paginated)" "$R" '"status":0'

R=$(curl -s "$BASE/bookings" -H "Authorization: Bearer $TOKEN")
check "GET /bookings (admin list)" "$R" '"status":0'

echo ""
echo "=== 7. NOTIFICATIONS WRITE ==="
R=$(curl -s -X POST "$BASE/notifications/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"System Alert","body":"Maintenance at midnight.","recipientType":"all_partners","notificationType":"push"}')
check "POST /notifications/send (all_partners)" "$R" '"status":0'

R=$(curl -s -X POST "$BASE/notifications/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Email Test","body":"Hello user.","recipientType":"all_customers","notificationType":"email"}')
check "POST /notifications/send (email type)" "$R" '"status":0'

echo ""
echo "=== 8. PARTNER DRIVER CRUD ==="
CREATE_DRV=$(curl -s -X POST "$BASE/partner/drivers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{
    "fullName":"John Driver",
    "phone":"+357 99 888777",
    "email":"john.driver@example.com",
    "licenseNumber":"DL-2024-001",
    "licenseExpiry":"2027-06-30",
    "insuranceExpiry":"2026-12-31",
    "status":"active"
  }')
check "POST /partner/drivers (create)" "$CREATE_DRV" '"status":0'
DRV_ID=$(echo "$CREATE_DRV" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('driver',{}).get('_id','') or d.get('id',''))" 2>/dev/null)

if [ -n "$DRV_ID" ]; then
  R=$(curl -s "$BASE/partner/drivers/$DRV_ID" -H "Authorization: Bearer $PTOKEN")
  check "GET /partner/drivers/:id" "$R" '"status":0'

  R=$(curl -s -X PUT "$BASE/partner/drivers/$DRV_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"fullName":"John A. Driver","phone":"+357 99 888778"}')
  check "PUT /partner/drivers/:id (update)" "$R" '"status":0'

  R=$(curl -s "$BASE/partner/drivers/active" -H "Authorization: Bearer $PTOKEN")
  check "GET /partner/drivers/active" "$R" '"status":0'

  R=$(curl -s "$BASE/partner/drivers/expiring" -H "Authorization: Bearer $PTOKEN")
  check "GET /partner/drivers/expiring" "$R" '"status":0'
fi

echo ""
echo "=== 9. PARTNER PRODUCT CRUD ==="
CREATE_PROD=$(curl -s -X POST "$BASE/partner/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{
    "name":"Premium Wax",
    "description":"Long-lasting car wax",
    "category":"cleaning",
    "price":12.99,
    "stock":50,
    "status":"available"
  }')
check "POST /partner/products (create)" "$CREATE_PROD" '"status":0'
PROD_ID=$(echo "$CREATE_PROD" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('product',{}).get('_id','') or d.get('id',''))" 2>/dev/null)

if [ -n "$PROD_ID" ]; then
  R=$(curl -s -X PATCH "$BASE/partner/products/$PROD_ID/stock" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"stock":45}')
  check "PATCH /partner/products/:id/stock" "$R" '"status":0'

  R=$(curl -s -X PATCH "$BASE/partner/products/$PROD_ID/toggle" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PTOKEN" \
    -d '{"status":"inactive"}')
  check "PATCH /partner/products/:id/toggle" "$R" '"status":0'
fi

echo ""
echo "=== 10. SETTINGS WRITE ==="
R=$(curl -s -X PUT "$BASE/settings/commission" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customerCommission":12,"partnerCommission":8}')
check "PUT /settings/commission" "$R" '"status":0'

R=$(curl -s -X PUT "$BASE/settings/booking-rules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"minAdvanceBookingHours":2,"maxAdvanceBookingDays":14,"cancellationWindowHours":24}')
check "PUT /settings/booking-rules" "$R" '"status":0'

echo ""
echo "=== 11. LEGAL CONTENT WRITE ==="
R=$(curl -s -X PUT "$BASE/legal/terms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"<p>Updated Terms and Conditions.</p>","version":"2.0"}')
check "PUT /legal/terms" "$R" '"status":0'

R=$(curl -s -X POST "$BASE/legal/faqs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question":"How do I cancel a booking?","answer":"<p>You can cancel via the app.</p>","category":"booking","order":1}')
check "POST /legal/faqs (create)" "$R" '"status":0'
FAQ_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

if [ -n "$FAQ_ID" ]; then
  R=$(curl -s -X PUT "$BASE/legal/faqs/$FAQ_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"question":"How do I cancel a booking? (Updated)","answer":"<p>Easy cancellation.</p>"}')
  check "PUT /legal/faqs/:id" "$R" '"status":0'

  R=$(curl -s -X DELETE "$BASE/legal/faqs/$FAQ_ID" \
    -H "Authorization: Bearer $TOKEN")
  check "DELETE /legal/faqs/:id" "$R" '"status":0'
fi

echo ""
echo "=== 12. SUPPORT TICKET FLOW ==="
R=$(curl -s "$BASE/support/tickets" -H "Authorization: Bearer $TOKEN")
check "GET /support/tickets" "$R" '"status":0'

echo ""
echo "=== 13. PARTNER SETTINGS WRITE ==="
R=$(curl -s -X PUT "$BASE/partner/settings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{"businessName":"Crystal Car Wash Updated","phone":"+357 25 888888","description":"Best car wash in Cyprus.","serviceRadius":15}')
check "PUT /partner/settings" "$R" '"status":0'

R=$(curl -s -X POST "$BASE/partner/settings/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PTOKEN" \
  -d '{"currentPassword":"partner123","newPassword":"newpartner456"}')
check "POST /partner/settings/password" "$R" '"status"'

echo ""
echo "=========================="
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "=========================="
