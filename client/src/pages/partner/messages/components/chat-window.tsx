import { Check, CheckCheck, Send, User } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { cn } from "@/utils";

import type { Conversation } from "../types";

interface ChatWindowProps {
	conversation: Conversation;
	newMessage: string;
	messagesEndRef: RefObject<HTMLDivElement | null>;
	onMessageChange: (value: string) => void;
	onSend: () => void;
}

export function ChatWindow({ conversation, newMessage, messagesEndRef, onMessageChange, onSend }: ChatWindowProps) {
	return (
		<Card className="flex-1 flex flex-col overflow-hidden">
			<CardHeader className="pb-3 border-b border-border flex-row items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
					<User className="h-5 w-5 text-primary" />
				</div>
				<CardTitle className="text-base">{conversation.customerName}</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
				{conversation.messages.map((message) => (
					<div
						key={message.id}
						className={cn("flex", message.senderId === "partner" ? "justify-end" : "justify-start")}
					>
						<div
							className={cn(
								"max-w-[70%] rounded-lg px-4 py-2",
								message.senderId === "partner"
									? "bg-primary text-primary-foreground"
									: "bg-muted dark:bg-muted",
							)}
						>
							<p className="text-sm">{message.text}</p>
							<div
								className={cn(
									"flex items-center justify-end gap-1 mt-1",
									message.senderId === "partner" ? "text-primary-foreground/70" : "text-muted-foreground",
								)}
							>
								<span className="text-[10px]">{message.timestamp}</span>
								{message.senderId === "partner" &&
									(message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
							</div>
						</div>
					</div>
				))}

				{conversation.isTyping && (
					<div className="flex justify-start">
						<div className="bg-muted dark:bg-muted rounded-lg px-4 py-2">
							<div className="flex items-center gap-1">
								<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
								<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
								<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
							</div>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</CardContent>

			<div className="p-4 border-t border-border">
				<div className="flex items-center gap-2">
					<Input
						placeholder="Type a message..."
						value={newMessage}
						onChange={(e) => onMessageChange(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
						className="flex-1"
					/>
					<Button onClick={onSend} disabled={!newMessage.trim()}>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}
