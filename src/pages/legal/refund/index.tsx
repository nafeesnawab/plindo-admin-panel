import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import legalService from "@/api/services/legalService";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

export default function RefundPolicyPage() {
	const queryClient = useQueryClient();
	const [content, setContent] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["legal-refund"],
		queryFn: () => legalService.getRefundPolicy(),
	});

	useEffect(() => {
		if (data) {
			setContent(data.content);
		}
	}, [data]);

	const updateMutation = useMutation({
		mutationFn: () => legalService.updateRefundPolicy({ content }),
		onSuccess: () => {
			toast.success("Refund policy updated");
			queryClient.invalidateQueries({ queryKey: ["legal-refund"] });
		},
		onError: () => toast.error("Failed to save"),
	});

	const hasChanges = data && content !== data.content;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[500px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Refund Policy</h1>
					<p className="text-muted-foreground">
						Last updated: {data?.updatedAt ? format(new Date(data.updatedAt), "PPp") : "Never"} by {data?.updatedBy}
					</p>
				</div>
				<Button onClick={() => updateMutation.mutate()} disabled={!hasChanges || updateMutation.isPending}>
					<Save className="h-4 w-4 mr-2" />
					Save Changes
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					<RichTextEditor value={content} onChange={setContent} />
				</CardContent>
			</Card>
		</div>
	);
}
