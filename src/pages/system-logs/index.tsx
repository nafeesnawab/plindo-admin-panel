import { useQuery } from "@tanstack/react-query";
import { Pagination, Tabs } from "antd";
import { format } from "date-fns";
import { useState } from "react";
import logsService from "@/api/services/logsService";
import { Badge } from "@/ui/badge";
import { Card, CardContent } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

const levelColors: Record<string, string> = {
	error: "bg-red-500/10 text-red-600",
	warning: "bg-yellow-500/10 text-yellow-600",
	critical: "bg-red-600/20 text-red-700",
};

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
			<div className="flex-1 min-h-0 overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-card z-10">
						<TableRow>
							<TableHead>Admin</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Target</TableHead>
							<TableHead>IP Address</TableHead>
							<TableHead>Timestamp</TableHead>
						</TableRow>
					</TableHeader>
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

function ErrorsTab() {
	const [levelFilter, setLevelFilter] = useState("all");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["logs-errors", levelFilter, page],
		queryFn: () => logsService.getSystemErrors({ level: levelFilter, page, limit: pageSize }),
	});

	if (isLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="shrink-0 flex justify-end mb-4">
				<Select
					value={levelFilter}
					onValueChange={(v) => {
						setLevelFilter(v);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="All Levels" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Levels</SelectItem>
						<SelectItem value="warning">Warning</SelectItem>
						<SelectItem value="error">Error</SelectItem>
						<SelectItem value="critical">Critical</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex-1 min-h-0 overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-card z-10">
						<TableRow>
							<TableHead>Level</TableHead>
							<TableHead>Message</TableHead>
							<TableHead>Source</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Timestamp</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.errors.map((error) => (
							<TableRow key={error.id}>
								<TableCell>
									<Badge className={levelColors[error.level]}>{error.level}</Badge>
								</TableCell>
								<TableCell className="max-w-[300px] truncate">{error.message}</TableCell>
								<TableCell>{error.source}</TableCell>
								<TableCell>
									<Badge variant={error.resolved ? "default" : "destructive"}>
										{error.resolved ? "Resolved" : "Open"}
									</Badge>
								</TableCell>
								<TableCell>{format(new Date(error.timestamp), "PPp")}</TableCell>
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
						showTotal={(total) => `Total ${total} errors`}
					/>
				</div>
			)}
		</div>
	);
}

function PaymentFailuresTab() {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["logs-payments", page],
		queryFn: () => logsService.getPaymentFailures({ page, limit: pageSize }),
	});

	if (isLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-card z-10">
						<TableRow>
							<TableHead>Transaction ID</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Error</TableHead>
							<TableHead>Retries</TableHead>
							<TableHead>Timestamp</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.failures.map((failure) => (
							<TableRow key={failure.id}>
								<TableCell className="font-mono text-xs">{failure.transactionId.slice(0, 16)}...</TableCell>
								<TableCell>{failure.userName}</TableCell>
								<TableCell>EUR{failure.amount.toFixed(2)}</TableCell>
								<TableCell>
									<Badge variant="destructive">{failure.errorCode}</Badge>
								</TableCell>
								<TableCell>{failure.retryCount}</TableCell>
								<TableCell>{format(new Date(failure.timestamp), "PPp")}</TableCell>
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
						showTotal={(total) => `Total ${total} failures`}
					/>
				</div>
			)}
		</div>
	);
}

function ApiErrorsTab() {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["logs-api", page],
		queryFn: () => logsService.getApiErrors({ page, limit: pageSize }),
	});

	if (isLoading) return <Skeleton className="h-[300px]" />;

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 overflow-auto">
				<Table>
					<TableHeader className="sticky top-0 bg-card z-10">
						<TableRow>
							<TableHead>Endpoint</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Error</TableHead>
							<TableHead>Response Time</TableHead>
							<TableHead>Timestamp</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.errors.map((error) => (
							<TableRow key={error.id}>
								<TableCell className="font-mono text-xs">{error.endpoint}</TableCell>
								<TableCell>
									<Badge variant="destructive">{error.statusCode}</Badge>
								</TableCell>
								<TableCell className="max-w-[200px] truncate">{error.errorMessage}</TableCell>
								<TableCell>{error.responseTime}ms</TableCell>
								<TableCell>{format(new Date(error.timestamp), "PPp")}</TableCell>
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
						showTotal={(total) => `Total ${total} errors`}
					/>
				</div>
			)}
		</div>
	);
}

export default function SystemLogsPage() {
	const [activeTab, setActiveTab] = useState("activity");

	const tabItems = [
		{ key: "activity", label: "Activity Log", children: <ActivityTab /> },
		{ key: "errors", label: "System Errors", children: <ErrorsTab /> },
		{ key: "payments", label: "Payment Failures", children: <PaymentFailuresTab /> },
		{ key: "api", label: "API Errors", children: <ApiErrorsTab /> },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<Card className="flex-1 min-h-0 flex flex-col">
				<CardContent className="pt-6 flex-1 min-h-0 flex flex-col">
					<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="ant-tabs-flex-fill" />
				</CardContent>
			</Card>
		</div>
	);
}
