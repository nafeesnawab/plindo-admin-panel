import { Search, User } from "lucide-react";

import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Input } from "@/ui/input";
import { cn } from "@/utils";

import type { Conversation } from "../types";

interface ConversationListProps {
	conversations: Conversation[];
	selectedId: string | null;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, searchQuery, onSearchChange, onSelect }: ConversationListProps) {
	return (
		<Card className="w-80 flex flex-col overflow-hidden">
			<CardHeader className="pb-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search conversations..."
						className="pl-10"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto p-0">
				{conversations.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground">No conversations found</div>
				) : (
					<div className="divide-y divide-border">
						{conversations.map((conv) => (
							<button
								type="button"
								key={conv.id}
								onClick={() => onSelect(conv)}
								className={cn(
									"w-full text-left p-4 cursor-pointer hover:bg-muted/50 transition-colors",
									selectedId === conv.id && "bg-muted",
								)}
							>
								<div className="flex items-start gap-3">
									<div className="relative">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
											<User className="h-5 w-5 text-primary" />
										</div>
										{conv.unreadCount > 0 && (
											<Badge
												variant="destructive"
												shape="circle"
												className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px]"
											>
												{conv.unreadCount}
											</Badge>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<p className={cn("font-medium truncate", conv.unreadCount > 0 && "font-semibold")}>
												{conv.customerName}
											</p>
											<span className="text-xs text-muted-foreground whitespace-nowrap">
												{conv.lastMessageTime}
											</span>
										</div>
										<p
											className={cn(
												"text-sm truncate mt-1",
												conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
											)}
										>
											{conv.isTyping ? <span className="italic text-primary">typing...</span> : conv.lastMessage}
										</p>
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
