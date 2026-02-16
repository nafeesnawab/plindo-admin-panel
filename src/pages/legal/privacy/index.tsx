import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, History, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import legalService, { type LegalVersion } from "@/api/services/legalService";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

export default function PrivacyPolicyPage() {
	const queryClient = useQueryClient();
	const [content, setContent] = useState("");
	const [previewVersion, setPreviewVersion] = useState<LegalVersion | null>(null);

	const { data: currentVersion, isLoading } = useQuery({
		queryKey: ["legal-privacy"],
		queryFn: () => legalService.getPrivacyPolicy(),
	});

	const { data: history } = useQuery({
		queryKey: ["legal-privacy-history"],
		queryFn: () => legalService.getPrivacyHistory(),
	});

	useEffect(() => {
		if (currentVersion) {
			setContent(currentVersion.content);
		}
	}, [currentVersion]);

	const updateMutation = useMutation({
		mutationFn: (publish: boolean) => legalService.updatePrivacyPolicy({ content, publish }),
		onSuccess: (_, publish) => {
			toast.success(publish ? "Privacy policy published" : "Draft saved");
			queryClient.invalidateQueries({ queryKey: ["legal-privacy"] });
			queryClient.invalidateQueries({ queryKey: ["legal-privacy-history"] });
		},
		onError: () => toast.error("Failed to save"),
	});

	const hasChanges = currentVersion && content !== currentVersion.content;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[500px]" />
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-auto space-y-6">
			<div className="shrink-0 flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					Version: {currentVersion?.version} • Last published:{" "}
					{currentVersion?.publishedAt ? format(new Date(currentVersion.publishedAt), "PPp") : "Never"}
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => updateMutation.mutate(false)}
						disabled={!hasChanges || updateMutation.isPending}
					>
						<Save className="h-4 w-4 mr-2" />
						Save Draft
					</Button>
					<Button onClick={() => updateMutation.mutate(true)} disabled={!hasChanges || updateMutation.isPending}>
						<Upload className="h-4 w-4 mr-2" />
						Publish
					</Button>
				</div>
			</div>

			<Tabs defaultValue="edit">
				<TabsList>
					<TabsTrigger value="edit">
						<FileText className="h-4 w-4 mr-2" />
						Edit
					</TabsTrigger>
					<TabsTrigger value="history">
						<History className="h-4 w-4 mr-2" />
						Version History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="edit" className="mt-4">
					<Card>
						<CardContent className="pt-6">
							<RichTextEditor value={content} onChange={setContent} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Version History</CardTitle>
							<CardDescription>Previous versions of Privacy Policy</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Version</TableHead>
										<TableHead>Published By</TableHead>
										<TableHead>Published At</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{history?.map((version) => (
										<TableRow key={version.id}>
											<TableCell className="font-medium">v{version.version}</TableCell>
											<TableCell>{version.publishedBy}</TableCell>
											<TableCell>{format(new Date(version.publishedAt), "PPp")}</TableCell>
											<TableCell>
												{version.isActive ? (
													<Badge className="bg-green-500/10 text-green-600">Active</Badge>
												) : (
													<Badge variant="secondary">Archived</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button variant="ghost" size="sm" onClick={() => setPreviewVersion(version)}>
													View
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Version {previewVersion?.version}</DialogTitle>
					</DialogHeader>
					<div
						className="prose prose-sm max-w-none"
						dangerouslySetInnerHTML={{ __html: previewVersion?.content || "" }}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
