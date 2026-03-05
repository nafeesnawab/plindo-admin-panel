import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import partnerDealsService, { type PartnerDeal } from "@/api/services/partnerDealsService";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";

interface DealForm {
	title: string;
	description: string;
	originalPrice: string;
	discountedPrice: string;
	validUntil: string;
	isMonthlyPackage: boolean;
	isActive: boolean;
}

const emptyForm: DealForm = {
	title: "",
	description: "",
	originalPrice: "",
	discountedPrice: "",
	validUntil: "",
	isMonthlyPackage: false,
	isActive: true,
};

function DealCard({ deal, onEdit, onDelete }: { deal: PartnerDeal; onEdit: () => void; onDelete: () => void }) {
	const isExpired = deal.validUntil ? new Date(deal.validUntil) < new Date() : false;
	const savings = deal.originalPrice - deal.discountedPrice;
	const pct = Math.round((savings / deal.originalPrice) * 100);

	return (
		<Card className={isExpired ? "opacity-60" : ""}>
			<CardContent className="pt-4 flex flex-col gap-2">
				<div className="flex items-start justify-between">
					<div>
						<div className="font-semibold">{deal.title}</div>
						{deal.description && <div className="text-xs text-muted-foreground mt-0.5">{deal.description}</div>}
					</div>
					<div className="flex gap-1">
						{deal.isMonthlyPackage && <Badge variant="outline" className="text-xs">Monthly</Badge>}
						{isExpired && <Badge className="bg-red-500/10 text-red-600 text-xs">Expired</Badge>}
					</div>
				</div>
				<div className="flex items-center gap-3 mt-1">
					<span className="text-muted-foreground line-through text-sm">EUR{deal.originalPrice}</span>
					<span className="text-lg font-bold text-green-600">EUR{deal.discountedPrice}</span>
					<Badge className="bg-green-500/10 text-green-600 text-xs">-{pct}%</Badge>
				</div>
				{deal.validUntil && (
					<div className="text-xs text-muted-foreground">
						Valid until: {format(new Date(deal.validUntil), "MMM dd, yyyy")}
					</div>
				)}
				<div className="flex gap-2 mt-2">
					<Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
						<Pencil className="h-3.5 w-3.5 mr-1" /> Edit
					</Button>
					<Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={onDelete}>
						<Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export default function PartnerDealsPage() {
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingDeal, setEditingDeal] = useState<PartnerDeal | null>(null);
	const [form, setForm] = useState<DealForm>(emptyForm);

	const { data, isLoading } = useQuery({
		queryKey: ["partner-deals"],
		queryFn: () => partnerDealsService.getDeals(),
	});

	const deals: PartnerDeal[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
	const activeDeals = deals.filter((d) => d.isActive && (!d.validUntil || new Date(d.validUntil) >= new Date()));
	const expiredDeals = deals.filter((d) => !d.isActive || (d.validUntil && new Date(d.validUntil) < new Date()));

	const createMutation = useMutation({
		mutationFn: (data: Parameters<typeof partnerDealsService.createDeal>[0]) =>
			partnerDealsService.createDeal(data),
		onSuccess: () => {
			toast.success("Deal created");
			queryClient.invalidateQueries({ queryKey: ["partner-deals"] });
			setDialogOpen(false);
		},
		onError: () => toast.error("Failed to create deal"),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<PartnerDeal> }) =>
			partnerDealsService.updateDeal(id, data),
		onSuccess: () => {
			toast.success("Deal updated");
			queryClient.invalidateQueries({ queryKey: ["partner-deals"] });
			setDialogOpen(false);
		},
		onError: () => toast.error("Failed to update deal"),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => partnerDealsService.deleteDeal(id),
		onSuccess: () => {
			toast.success("Deal deleted");
			queryClient.invalidateQueries({ queryKey: ["partner-deals"] });
		},
		onError: () => toast.error("Failed to delete deal"),
	});

	const openCreate = () => {
		setEditingDeal(null);
		setForm(emptyForm);
		setDialogOpen(true);
	};

	const openEdit = (deal: PartnerDeal) => {
		setEditingDeal(deal);
		setForm({
			title: deal.title,
			description: deal.description || "",
			originalPrice: String(deal.originalPrice),
			discountedPrice: String(deal.discountedPrice),
			validUntil: deal.validUntil ? deal.validUntil.split("T")[0] : "",
			isMonthlyPackage: deal.isMonthlyPackage,
			isActive: deal.isActive,
		});
		setDialogOpen(true);
	};

	const handleSubmit = () => {
		const payload = {
			title: form.title,
			description: form.description,
			services: [],
			originalPrice: parseFloat(form.originalPrice),
			discountedPrice: parseFloat(form.discountedPrice),
			validUntil: form.validUntil || undefined,
			isMonthlyPackage: form.isMonthlyPackage,
			isActive: form.isActive,
		};
		if (editingDeal) updateMutation.mutate({ id: editingDeal._id, data: payload });
		else createMutation.mutate(payload);
	};

	const DealGrid = ({ items }: { items: PartnerDeal[] }) => {
		if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>;
		if (!items.length) return <div className="text-center text-muted-foreground py-12 text-sm">No deals yet</div>;
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{items.map((d) => (
					<DealCard
						key={d._id}
						deal={d}
						onEdit={() => openEdit(d)}
						onDelete={() => deleteMutation.mutate(d._id)}
					/>
				))}
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Tag className="h-5 w-5" />
					<h2 className="text-lg font-semibold">Deals & Packages</h2>
				</div>
				<Button onClick={openCreate}>
					<Plus className="h-4 w-4 mr-1" /> Create Deal
				</Button>
			</div>

			<Tabs defaultValue="active">
				<TabsList>
					<TabsTrigger value="active">Active ({activeDeals.length})</TabsTrigger>
					<TabsTrigger value="expired">Expired / Inactive ({expiredDeals.length})</TabsTrigger>
				</TabsList>
				<TabsContent value="active" className="mt-4">
					<DealGrid items={activeDeals} />
				</TabsContent>
				<TabsContent value="expired" className="mt-4">
					<DealGrid items={expiredDeals} />
				</TabsContent>
			</Tabs>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editingDeal ? "Edit Deal" : "Create Deal"}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3">
						<div>
							<Label>Title *</Label>
							<Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
						</div>
						<div>
							<Label>Description</Label>
							<Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label>Original Price (EUR) *</Label>
								<Input type="number" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
							</div>
							<div>
								<Label>Deal Price (EUR) *</Label>
								<Input type="number" value={form.discountedPrice} onChange={(e) => setForm((f) => ({ ...f, discountedPrice: e.target.value }))} />
							</div>
						</div>
						<div>
							<Label>Valid Until</Label>
							<Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
						</div>
						<div className="flex items-center justify-between">
							<Label>Monthly Package</Label>
							<Switch checked={form.isMonthlyPackage} onCheckedChange={(v) => setForm((f) => ({ ...f, isMonthlyPackage: v }))} />
						</div>
						<div className="flex items-center justify-between">
							<Label>Active</Label>
							<Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
						<Button
							onClick={handleSubmit}
							disabled={!form.title || !form.originalPrice || !form.discountedPrice || createMutation.isPending || updateMutation.isPending}
						>
							{editingDeal ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
