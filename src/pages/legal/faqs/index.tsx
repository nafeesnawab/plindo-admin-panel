import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, HelpCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import legalService, { type FAQ } from "@/api/services/legalService";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Switch } from "@/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

export default function FAQManagementPage() {
	const queryClient = useQueryClient();
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [formData, setFormData] = useState({ question: "", answer: "", category: "" });

	const { data, isLoading } = useQuery({
		queryKey: ["legal-faqs", selectedCategory],
		queryFn: () => legalService.getFAQs(selectedCategory === "all" ? undefined : selectedCategory),
	});

	const createMutation = useMutation({
		mutationFn: () => legalService.createFAQ(formData),
		onSuccess: () => {
			toast.success("FAQ created");
			queryClient.invalidateQueries({ queryKey: ["legal-faqs"] });
			setIsCreating(false);
			setFormData({ question: "", answer: "", category: "" });
		},
		onError: () => toast.error("Failed to create FAQ"),
	});

	const updateMutation = useMutation({
		mutationFn: () =>
			legalService.updateFAQ(editingFaq!.id, {
				question: formData.question,
				answer: formData.answer,
				category: formData.category,
			}),
		onSuccess: () => {
			toast.success("FAQ updated");
			queryClient.invalidateQueries({ queryKey: ["legal-faqs"] });
			setEditingFaq(null);
		},
		onError: () => toast.error("Failed to update FAQ"),
	});

	const toggleMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => legalService.updateFAQ(id, { isActive }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["legal-faqs"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => legalService.deleteFAQ(id),
		onSuccess: () => {
			toast.success("FAQ deleted");
			queryClient.invalidateQueries({ queryKey: ["legal-faqs"] });
		},
		onError: () => toast.error("Failed to delete FAQ"),
	});

	const openEditor = (faq?: FAQ) => {
		if (faq) {
			setEditingFaq(faq);
			setFormData({ question: faq.question, answer: faq.answer, category: faq.category });
		} else {
			setIsCreating(true);
			setFormData({ question: "", answer: "", category: data?.categories[0] || "" });
		}
	};

	const closeEditor = () => {
		setEditingFaq(null);
		setIsCreating(false);
		setFormData({ question: "", answer: "", category: "" });
	};

	const handleSave = () => {
		if (editingFaq) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[400px]" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">FAQ Management</h1>
					<p className="text-muted-foreground">
						{data?.faqs.length || 0} FAQs across {data?.categories.length || 0} categories
					</p>
				</div>
				<Button onClick={() => openEditor()}>
					<Plus className="h-4 w-4 mr-2" />
					Add FAQ
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<Label>Filter by Category:</Label>
				<Select value={selectedCategory} onValueChange={setSelectedCategory}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{data?.categories.map((cat) => (
							<SelectItem key={cat} value={cat}>
								{cat}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<HelpCircle className="h-5 w-5" />
						Frequently Asked Questions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Question</TableHead>
								<TableHead className="w-32">Category</TableHead>
								<TableHead className="w-24">Status</TableHead>
								<TableHead className="w-32 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.faqs.map((faq, index) => (
								<TableRow key={faq.id}>
									<TableCell className="font-medium">{index + 1}</TableCell>
									<TableCell>
										<p className="font-medium">{faq.question}</p>
										<p
											className="text-sm text-muted-foreground line-clamp-1"
											dangerouslySetInnerHTML={{ __html: faq.answer.replace(/<[^>]*>/g, " ").slice(0, 100) }}
										/>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{faq.category}</Badge>
									</TableCell>
									<TableCell>
										<Switch
											checked={faq.isActive}
											onCheckedChange={(checked) => toggleMutation.mutate({ id: faq.id, isActive: checked })}
										/>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button variant="ghost" size="icon" onClick={() => openEditor(faq)}>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive"
												onClick={() => deleteMutation.mutate(faq.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
							{data?.faqs.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
										No FAQs found. Click "Add FAQ" to create one.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={isCreating || !!editingFaq} onOpenChange={closeEditor}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editingFaq ? "Edit FAQ" : "Create New FAQ"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Question</Label>
							<Input
								value={formData.question}
								onChange={(e) => setFormData({ ...formData, question: e.target.value })}
								placeholder="Enter the question..."
							/>
						</div>
						<div className="space-y-2">
							<Label>Category</Label>
							<Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{data?.categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Answer</Label>
							<RichTextEditor
								value={formData.answer}
								onChange={(value) => setFormData({ ...formData, answer: value })}
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button variant="outline" onClick={closeEditor}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={
								!formData.question ||
								!formData.answer ||
								!formData.category ||
								createMutation.isPending ||
								updateMutation.isPending
							}
						>
							{editingFaq ? "Save Changes" : "Create FAQ"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
