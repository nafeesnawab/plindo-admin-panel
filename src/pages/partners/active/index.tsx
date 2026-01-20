import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import partnerService, { type Partner } from "@/api/services/partnerService";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import { Textarea } from "@/ui/textarea";
import { CheckCircle, Eye, Pause, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

const cyprusCities = ["All Locations", "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"];

export default function ActivePartners() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [ratingFilter, setRatingFilter] = useState<string>("");
	const [locationFilter, setLocationFilter] = useState<string>("");
	const [verifiedFilter, setVerifiedFilter] = useState<string>("");
	const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
	const [suspendReason, setSuspendReason] = useState("");
	const [showSuspendDialog, setShowSuspendDialog] = useState(false);
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["active-partners", page, search, ratingFilter, locationFilter, verifiedFilter],
		queryFn: () =>
			partnerService.getActivePartners({
				page,
				limit: 10,
				search: search || undefined,
				rating: ratingFilter || undefined,
				location: locationFilter === "All Locations" ? undefined : locationFilter || undefined,
				verified: verifiedFilter || undefined,
			}),
	});

	const suspendMutation = useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			partnerService.suspendPartner(id, reason),
		onSuccess: () => {
			toast.success("Partner suspended");
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			setShowSuspendDialog(false);
			setSelectedPartner(null);
			setSuspendReason("");
		},
		onError: () => {
			toast.error("Failed to suspend partner");
		},
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => partnerService.removePartner(id),
		onSuccess: () => {
			toast.success("Partner removed");
			queryClient.invalidateQueries({ queryKey: ["active-partners"] });
			setShowRemoveDialog(false);
			setSelectedPartner(null);
		},
		onError: () => {
			toast.error("Failed to remove partner");
		},
	});

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
	};

	const handleSuspend = () => {
		if (selectedPartner && suspendReason) {
			suspendMutation.mutate({ id: selectedPartner.id, reason: suspendReason });
		}
	};

	const handleRemove = () => {
		if (selectedPartner) {
			removeMutation.mutate(selectedPartner.id);
		}
	};

	const openSuspendDialog = (partner: Partner) => {
		setSelectedPartner(partner);
		setShowSuspendDialog(true);
	};

	const openRemoveDialog = (partner: Partner) => {
		setSelectedPartner(partner);
		setShowRemoveDialog(true);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Active Partners</span>
						<Badge variant="secondary" className="text-lg">
							{data?.total || 0} partners
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4 mb-6">
						<div className="flex gap-2 flex-1 min-w-[200px]">
							<Input
								placeholder="Search by name or business..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="max-w-sm"
							/>
							<Button variant="outline" size="icon" onClick={handleSearch}>
								<Search className="h-4 w-4" />
							</Button>
						</div>
						<Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
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
						<Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Location" />
							</SelectTrigger>
							<SelectContent>
								{cyprusCities.map((city) => (
									<SelectItem key={city} value={city}>{city}</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1); }}>
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

					{data?.items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No partners found
						</div>
					) : (
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
							<TableBody>
								{data?.items.map((partner) => (
									<TableRow key={partner.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{partner.businessName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
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
												<Button
													variant="ghost"
													size="icon"
													onClick={() => navigate(`/partners/${partner.id}`)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
													onClick={() => openSuspendDialog(partner)}
												>
													<Pause className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => openRemoveDialog(partner)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {data.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

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
							onClick={handleSuspend}
							disabled={!suspendReason || suspendMutation.isPending}
						>
							Suspend
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
							onClick={handleRemove}
							disabled={removeMutation.isPending}
						>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
