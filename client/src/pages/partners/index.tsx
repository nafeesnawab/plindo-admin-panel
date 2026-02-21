import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCircle, Eye, Pause, Play, Search, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import partnerService, { type Partner } from "@/api/services/partnerService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Textarea } from "@/ui/textarea";

const cyprusCities = ["All Locations", "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"];

export default function PartnerManagementPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("active");

	const [pendingPage, setPendingPage] = useState(1);
	const [activePage, setActivePage] = useState(1);
	const [suspendedPage, setSuspendedPage] = useState(1);

	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [ratingFilter, setRatingFilter] = useState<string>("");
	const [locationFilter, setLocationFilter] = useState<string>("");
	const [verifiedFilter, setVerifiedFilter] = useState<string>("");

	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [suspendReason, setSuspendReason] = useState("");
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [showSuspendDialog, setShowSuspendDialog] = useState(false);
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);
	const [showReactivateDialog, setShowReactivateDialog] = useState(false);

	const { data: pendingData, isLoading: pendingLoading } = useQuery({
		queryKey: ["pending-partners", pendingPage],
		queryFn: () => partnerService.getPendingPartners({ page: pendingPage, limit: 10 }),
	});

	const { data: activeData, isLoading: activeLoading } = useQuery({
		queryKey: ["active-partners", activePage, search, ratingFilter, locationFilter, verifiedFilter],
		queryFn: () =>
			partnerService.getActivePartners({
				page: activePage,
				limit: 10,
				search: search || undefined,
				rating: ratingFilter || undefined,
				location: locationFilter === "All Locations" ? undefined : locationFilter || undefined,
				verified: verifiedFilter || undefined,
			}),
	});

	const { data: suspendedData, isLoading: suspendedLoading } = useQuery({
		queryKey: ["suspended-partners", suspendedPage],
		queryFn: () => partnerService.getSuspendedPartners({ page: suspendedPage, limit: 10 }),
	});

	const approveMutation = useMutation({
		mutationFn: (id: string) => partnerService.approvePartner(id),
		onSuccess: () => {
			toast.success("Partner approved successfully");
			queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
		},
		onError: () => toast.error("Failed to approve partner"),
	});

	const rejectMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => partnerService.rejectPartner(id, reason),
		onSuccess: () => {
			toast.success("Partner rejected");
			queryClient.invalidateQueries({ queryKey: ["pending-partners"] });
			setShowRejectDialog(false);
			setSelectedPartner(null);
			setRejectReason("");
		},
		onError: () => toast.error("Failed to reject partner"),
	});

	const suspendMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => partnerService.suspendPartner(id, reason),
		onSuccess: () => {
			toast.success("Partner suspended");
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			queryClient.invalidateQueries({ queryKey: ["suspended-partners"] });
			setShowSuspendDialog(false);
			setSelectedPartner(null);
			setSuspendReason("");
		},
		onError: () => toast.error("Failed to suspend partner"),
	});

	const reactivateMutation = useMutation({
		mutationFn: (id: string) => partnerService.reactivatePartner(id),
		onSuccess: () => {
			toast.success("Partner reactivated");
			queryClient.invalidateQueries({ queryKey: ["suspended-partners"] });
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			setShowReactivateDialog(false);
			setSelectedPartner(null);
		},
		onError: () => toast.error("Failed to reactivate partner"),
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => partnerService.removePartner(id),
		onSuccess: () => {
			toast.success("Partner removed");
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			queryClient.invalidateQueries({ queryKey: ["suspended-partners"] });
			setShowRemoveDialog(false);
			setSelectedPartner(null);
		},
		onError: () => toast.error("Failed to remove partner"),
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setActivePage(1);
	};

	const renderSkeleton = () => (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-16 w-full" />
			))}
		</div>
	);

	const renderPendingTab = () => {
		if (pendingLoading) return renderSkeleton();
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				{pendingData?.items.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No pending applications</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Business</TableHead>
									<TableHead>Owner</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Applied</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
						</Table>
						<div className="flex-1 min-h-0 overflow-auto">
							<Table>
								<TableBody>
									{pendingData?.items.map((partner) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10">
														<AvatarFallback className="bg-primary/10 text-primary text-xs">
															{partner.businessName
																.split(" ")
																.slice(0, 2)
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{partner.businessName}</p>
														<p className="text-xs text-muted-foreground">License: {partner.businessLicense}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>{partner.ownerName}</TableCell>
											<TableCell>{partner.location}</TableCell>
											<TableCell>
												<div className="text-sm">
													<p>{partner.email}</p>
													<p className="text-muted-foreground">{partner.phone}</p>
												</div>
											</TableCell>
											<TableCell>{formatDistanceToNow(new Date(partner.appliedAt), { addSuffix: true })}</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partner.id}`)}>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-green-600 hover:text-green-700 hover:bg-green-50"
														onClick={() => approveMutation.mutate(partner.id)}
														disabled={approveMutation.isPending}
													>
														<Check className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
														onClick={() => {
															setSelectedPartner(partner);
															setShowRejectDialog(true);
														}}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
				{pendingData && pendingData.total > 10 && (
					<div className="shrink-0 flex justify-center py-3 border-t">
						<Pagination
							current={pendingPage}
							total={pendingData.total}
							pageSize={10}
							onChange={(p) => setPendingPage(p)}
							showSizeChanger={false}
							showTotal={(total) => `Total ${total} applications`}
						/>
					</div>
				)}
			</div>
		);
	};

	const renderActiveTab = () => {
		if (activeLoading) return renderSkeleton();
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				<div className="shrink-0 flex flex-wrap gap-4 mb-4">
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by name or business..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="pl-9 pr-9"
						/>
						{searchInput && (
							<button
								type="button"
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onClick={() => { setSearchInput(""); setSearch(""); setActivePage(1); }}
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
					<Select
						value={ratingFilter}
						onValueChange={(v) => {
							setRatingFilter(v);
							setActivePage(1);
						}}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Rating" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Ratings</SelectItem>
							<SelectItem value="4.5">4.5+ Stars</SelectItem>
							<SelectItem value="4">4+ Stars</SelectItem>
							<SelectItem value="3.5">3.5+ Stars</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={locationFilter}
						onValueChange={(v) => {
							setLocationFilter(v);
							setActivePage(1);
						}}
					>
						<SelectTrigger className="w-[150px]">
							<SelectValue placeholder="Location" />
						</SelectTrigger>
						<SelectContent>
							{cyprusCities.map((city) => (
								<SelectItem key={city} value={city}>
									{city}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={verifiedFilter}
						onValueChange={(v) => {
							setVerifiedFilter(v);
							setActivePage(1);
						}}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Verification" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="true">Verified</SelectItem>
							<SelectItem value="false">Unverified</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{activeData?.items.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No partners found</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Business</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Rating</TableHead>
									<TableHead>Bookings</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
						</Table>
						<div className="flex-1 min-h-0 overflow-auto">
							<Table>
								<TableBody>
									{activeData?.items.map((partner) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10">
														<AvatarFallback className="bg-primary/10 text-primary text-xs">
															{partner.businessName
																.split(" ")
																.slice(0, 2)
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{partner.businessName}</p>
														<p className="text-xs text-muted-foreground">{partner.ownerName}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>{partner.location}</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
													<span>{partner.rating?.toFixed(1) || "N/A"}</span>
												</div>
											</TableCell>
											<TableCell>{partner.totalBookings.toLocaleString()}</TableCell>
											<TableCell>
												{partner.isVerified ? (
													<Badge variant="secondary" className="bg-green-500/10 text-green-600">
														<CheckCircle className="h-3 w-3 mr-1" />
														Verified
													</Badge>
												) : (
													<Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
														Unverified
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partner.id}`)}>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
														onClick={() => {
															setSelectedPartner(partner);
															setShowSuspendDialog(true);
														}}
													>
														<Pause className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
														onClick={() => {
															setSelectedPartner(partner);
															setShowRemoveDialog(true);
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
				{activeData && activeData.total > 10 && (
					<div className="shrink-0 flex justify-center py-3 border-t">
						<Pagination
							current={activePage}
							total={activeData.total}
							pageSize={10}
							onChange={(p) => setActivePage(p)}
							showSizeChanger={false}
							showTotal={(total) => `Total ${total} partners`}
						/>
					</div>
				)}
			</div>
		);
	};

	const renderSuspendedTab = () => {
		if (suspendedLoading) return renderSkeleton();
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				{suspendedData?.items.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No suspended partners</div>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Business</TableHead>
									<TableHead>Location</TableHead>
									<TableHead>Suspension Reason</TableHead>
									<TableHead>Suspended</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
						</Table>
						<div className="flex-1 min-h-0 overflow-auto">
							<Table>
								<TableBody>
									{suspendedData?.items.map((partner) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10">
														<AvatarFallback className="bg-red-500/10 text-red-600 text-xs">
															{partner.businessName
																.split(" ")
																.slice(0, 2)
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{partner.businessName}</p>
														<p className="text-xs text-muted-foreground">{partner.ownerName}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>{partner.location}</TableCell>
											<TableCell>
												<p className="text-sm text-red-600 max-w-[200px] truncate">{partner.suspensionReason}</p>
											</TableCell>
											<TableCell>
												{partner.suspendedAt && formatDistanceToNow(new Date(partner.suspendedAt), { addSuffix: true })}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partner.id}`)}>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-green-600 hover:text-green-700 hover:bg-green-50"
														onClick={() => {
															setSelectedPartner(partner);
															setShowReactivateDialog(true);
														}}
													>
														<Play className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
														onClick={() => {
															setSelectedPartner(partner);
															setShowRemoveDialog(true);
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
				{suspendedData && suspendedData.total > 10 && (
					<div className="shrink-0 flex justify-center py-3 border-t">
						<Pagination
							current={suspendedPage}
							total={suspendedData.total}
							pageSize={10}
							onChange={(p) => setSuspendedPage(p)}
							showSizeChanger={false}
							showTotal={(total) => `Total ${total} suspended`}
						/>
					</div>
				)}
			</div>
		);
	};

	const tabItems = [
		{
			key: "pending",
			label: `Pending Applications (${pendingData?.total || 0})`,
			children: renderPendingTab(),
		},
		{
			key: "active",
			label: `Active Partners (${activeData?.total || 0})`,
			children: renderActiveTab(),
		},
		{
			key: "suspended",
			label: `Suspended (${suspendedData?.total || 0})`,
			children: renderSuspendedTab(),
		},
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>

			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Application</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting {selectedPartner?.businessName}'s application.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter rejection reason..."
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRejectDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (selectedPartner && rejectReason) {
									rejectMutation.mutate({ id: selectedPartner.id, reason: rejectReason });
								}
							}}
							disabled={!rejectReason || rejectMutation.isPending}
						>
							Reject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Suspend Partner</DialogTitle>
						<DialogDescription>
							Please provide a reason for suspending {selectedPartner?.businessName}.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter suspension reason..."
						value={suspendReason}
						onChange={(e) => setSuspendReason(e.target.value)}
						rows={4}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (selectedPartner && suspendReason) {
									suspendMutation.mutate({ id: selectedPartner.id, reason: suspendReason });
								}
							}}
							disabled={!suspendReason || suspendMutation.isPending}
						>
							Suspend
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reactivate Partner</DialogTitle>
						<DialogDescription>
							Are you sure you want to reactivate {selectedPartner?.businessName}? They will be moved back to active
							partners.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedPartner) reactivateMutation.mutate(selectedPartner.id);
							}}
							disabled={reactivateMutation.isPending}
						>
							Reactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove Partner</DialogTitle>
						<DialogDescription>
							Are you sure you want to permanently remove {selectedPartner?.businessName}? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (selectedPartner) removeMutation.mutate(selectedPartner.id);
							}}
							disabled={removeMutation.isPending}
						>
							Remove Permanently
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
