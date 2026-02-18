import { MessageSquare } from "lucide-react";

import { Card } from "@/ui/card";

export function EmptyChat() {
	return (
		<Card className="flex-1 flex items-center justify-center">
			<div className="text-center text-muted-foreground">
				<MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
				<p className="text-lg font-medium">Select a conversation</p>
				<p className="text-sm">Choose a customer to start messaging</p>
			</div>
		</Card>
	);
}
