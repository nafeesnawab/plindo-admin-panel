import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import apiClient from "@/api/apiClient";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

interface PortfolioResponse {
	portfolioImages: string[];
}

const fetchPortfolio = async (): Promise<PortfolioResponse> => {
	const res = await apiClient.get<PortfolioResponse>({ url: "/partner/settings" });
	return { portfolioImages: (res as any)?.portfolioImages ?? [] };
};

export function PortfolioCard() {
	const queryClient = useQueryClient();
	const fileRef = useRef<HTMLInputElement>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["partner-portfolio"],
		queryFn: fetchPortfolio,
	});

	const images = data?.portfolioImages ?? [];
	const remaining = 10 - images.length;

	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const form = new FormData();
			form.append("image", file);
			return apiClient.postForm<PortfolioResponse>({ url: "/partner/portfolio", data: form });
		},
		onSuccess: () => {
			toast.success("Image uploaded");
			queryClient.invalidateQueries({ queryKey: ["partner-portfolio"] });
		},
		onError: () => toast.error("Upload failed"),
	});

	const deleteMutation = useMutation({
		mutationFn: (index: number) => apiClient.delete({ url: `/partner/portfolio/${index}` }),
		onSuccess: () => {
			toast.success("Image removed");
			queryClient.invalidateQueries({ queryKey: ["partner-portfolio"] });
		},
		onError: () => toast.error("Failed to remove image"),
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) uploadMutation.mutate(file);
		e.target.value = "";
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">Portfolio / Gallery</CardTitle>
					<span className="text-xs text-muted-foreground">{images.length} / 10 images</span>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="grid grid-cols-3 gap-2">
						{["a", "b", "c"].map((k) => <Skeleton key={k} className="aspect-square rounded-lg" />)}
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{images.map((url, i) => (
							<div key={url} className="relative group aspect-square rounded-lg overflow-hidden border">
								<img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
								<button
									type="button"
									onClick={() => deleteMutation.mutate(i)}
									className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
								>
									<Trash2 className="h-5 w-5 text-white" />
								</button>
							</div>
						))}
						{remaining > 0 && (
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								disabled={uploadMutation.isPending}
								className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary"
							>
								<ImagePlus className="h-5 w-5" />
								<span className="text-xs">Add</span>
							</button>
						)}
					</div>
				)}
				<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
				{remaining > 0 && (
					<Button
						variant="outline"
						size="sm"
						className="w-full mt-3"
						onClick={() => fileRef.current?.click()}
						disabled={uploadMutation.isPending}
					>
						<ImagePlus className="h-4 w-4 mr-2" />
						{uploadMutation.isPending ? "Uploading..." : `Upload Image (${remaining} slots left)`}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
