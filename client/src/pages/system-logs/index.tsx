import { useQuery } from "@tanstack/react-query";
import { Pagination } from "antd";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import logsService from "@/api/services/logsService";
import { Badge } from "@/ui/badge";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

function ActivityTab() {
	const [actionFilter, setActionFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["logs-activity", actionFilter, searchQuery, page],
		queryFn: () => logsService.getActivityLogs({ action: actionFilter, search: searchQuery, page, limit: pageSize }),
	});

	if (isLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="shrink-0 flex gap-3 mb-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search logs..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Select
					value={actionFilter}
					onValueChange={(v) => {
						setActionFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="All Actions" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Actions</SelectItem>
						{data?.actions?.map((action) => (
							<SelectItem key={action} value={action}>
								{action.replace(/_/g, " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User</TableHead>
						<TableHead>Action</TableHead>
						<TableHead>Target</TableHead>
						<TableHead>IP Address</TableHead>
						<TableHead>Timestamp</TableHead>
					</TableRow>
				</TableHeader>
			</Table>
			<div className="flex-1 min-h-0 overflow-auto">
				<Table>
					<TableBody>
						{data?.logs.map((log) => (
							<TableRow key={log.id}>
								<TableCell className="font-medium">{log.adminName}</TableCell>
								<TableCell>
									<Badge variant="secondary">{log.action.replace(/_/g, " ")}</Badge>
								</TableCell>
								<TableCell>
									<Badge variant="outline">{log.targetType || "N/A"}</Badge>
								</TableCell>
								<TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
								<TableCell>{format(new Date(log.timestamp), "PPp")}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{data?.pagination && data.pagination.total > pageSize && (
				<div className="shrink-0 flex justify-center py-3 border-t">
					<Pagination
						current={page}
						total={data.pagination.total}
						pageSize={pageSize}
						onChange={setPage}
						showSizeChanger={false}
						showTotal={(total) => `Total ${total} logs`}
					/>
				</div>
			)}
		</div>
	);
}

export default function SystemLogsPage() {
	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
					<ActivityTab />
				</CardContent>
			</Card>
		</div>
	);
}
