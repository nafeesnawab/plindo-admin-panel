import { useQuery } from "@tanstack/react-query";
import { Pagination } from "antd";
import { format } from "date-fns";
import { useState } from "react";
import logsService from "@/api/services/logsService";
import { Badge } from "@/ui/badge";
import { Card, CardContent } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

function ActivityTab() {
	const [adminFilter, setAdminFilter] = useState("all");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["logs-activity", adminFilter, page],
		queryFn: () => logsService.getActivityLogs({ admin: adminFilter, page, limit: pageSize }),
	});

	if (isLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="shrink-0 flex justify-end mb-4">
				<Select
					value={adminFilter}
					onValueChange={(v) => {
						setAdminFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="All Admins" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Admins</SelectItem>
						{data?.admins.map((admin) => (
							<SelectItem key={admin} value={admin}>
								{admin}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Admin</TableHead>
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
								<TableCell>{log.action}</TableCell>
								<TableCell>
									<Badge variant="outline">{log.targetType}</Badge>
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
