import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, AlertTriangle, CreditCard, Server } from "lucide-react";
import { useState } from "react";
import logsService from "@/api/services/logsService";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

const levelColors: Record<string, string> = {
	error: "bg-red-500/10 text-red-600",
	warning: "bg-yellow-500/10 text-yellow-600",
	critical: "bg-red-600/20 text-red-700",
};

export default function SystemLogsPage() {
	const [adminFilter, setAdminFilter] = useState("all");
	const [errorLevelFilter, setErrorLevelFilter] = useState("all");

	const { data: activityData, isLoading: activityLoading } = useQuery({
		queryKey: ["logs-activity", adminFilter],
		queryFn: () => logsService.getActivityLogs({ admin: adminFilter, limit: 20 }),
	});

	const { data: errorsData, isLoading: errorsLoading } = useQuery({
		queryKey: ["logs-errors", errorLevelFilter],
		queryFn: () => logsService.getSystemErrors({ level: errorLevelFilter, limit: 20 }),
	});

	const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
		queryKey: ["logs-payments"],
		queryFn: () => logsService.getPaymentFailures({ limit: 20 }),
	});

	const { data: apiData, isLoading: apiLoading } = useQuery({
		queryKey: ["logs-api"],
		queryFn: () => logsService.getApiErrors({ limit: 20 }),
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">System Logs</h1>
				<p className="text-muted-foreground">Monitor admin actions and system events</p>
			</div>

			<Tabs defaultValue="activity">
				<TabsList>
					<TabsTrigger value="activity" className="gap-2">
						<Activity className="h-4 w-4" />
						Activity
					</TabsTrigger>
					<TabsTrigger value="errors" className="gap-2">
						<AlertTriangle className="h-4 w-4" />
						System Errors
					</TabsTrigger>
					<TabsTrigger value="payments" className="gap-2">
						<CreditCard className="h-4 w-4" />
						Payment Failures
					</TabsTrigger>
					<TabsTrigger value="api" className="gap-2">
						<Server className="h-4 w-4" />
						API Errors
					</TabsTrigger>
				</TabsList>

				<TabsContent value="activity" className="mt-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Admin Activity Log</CardTitle>
									<CardDescription>Track all admin actions</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Label>Admin:</Label>
									<Select value={adminFilter} onValueChange={setAdminFilter}>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Admins</SelectItem>
											{activityData?.admins.map((admin) => (
												<SelectItem key={admin} value={admin}>
													{admin}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{activityLoading ? (
								<Skeleton className="h-[300px]" />
							) : (
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
									<TableBody>
										{activityData?.logs.map((log) => (
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
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="errors" className="mt-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>System Errors</CardTitle>
									<CardDescription>Application and server errors</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Label>Level:</Label>
									<Select value={errorLevelFilter} onValueChange={setErrorLevelFilter}>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Levels</SelectItem>
											<SelectItem value="warning">Warning</SelectItem>
											<SelectItem value="error">Error</SelectItem>
											<SelectItem value="critical">Critical</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{errorsLoading ? (
								<Skeleton className="h-[300px]" />
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Level</TableHead>
											<TableHead>Message</TableHead>
											<TableHead>Source</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Timestamp</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{errorsData?.errors.map((error) => (
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
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="payments" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Payment Failures</CardTitle>
							<CardDescription>Failed payment transactions</CardDescription>
						</CardHeader>
						<CardContent>
							{paymentsLoading ? (
								<Skeleton className="h-[300px]" />
							) : (
								<Table>
									<TableHeader>
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
										{paymentsData?.failures.map((failure) => (
											<TableRow key={failure.id}>
												<TableCell className="font-mono text-xs">{failure.transactionId.slice(0, 16)}...</TableCell>
												<TableCell>{failure.userName}</TableCell>
												<TableCell>€{failure.amount.toFixed(2)}</TableCell>
												<TableCell>
													<Badge variant="destructive">{failure.errorCode}</Badge>
												</TableCell>
												<TableCell>{failure.retryCount}</TableCell>
												<TableCell>{format(new Date(failure.timestamp), "PPp")}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="api" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>API Errors</CardTitle>
							<CardDescription>Failed API requests</CardDescription>
						</CardHeader>
						<CardContent>
							{apiLoading ? (
								<Skeleton className="h-[300px]" />
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Endpoint</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Error</TableHead>
											<TableHead>Response Time</TableHead>
											<TableHead>Timestamp</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{apiData?.errors.map((error) => (
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
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
