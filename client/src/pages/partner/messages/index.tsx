import { ChatWindow } from "./components/chat-window";
import { ConversationList } from "./components/conversation-list";
import { EmptyChat } from "./components/empty-chat";
import { useMessages } from "./hooks/use-messages";

export default function PartnerMessagesPage() {
	const {
		conversations,
		selectedConversation,
		searchQuery,
		newMessage,
		messagesEndRef,
		setSearchQuery,
		setNewMessage,
		setSelectedConversation,
		handleSendMessage,
	} = useMessages();

	return (
		<div className="flex h-[calc(100vh-120px)] gap-4">
			<ConversationList
				conversations={conversations}
				selectedId={selectedConversation?.id ?? null}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onSelect={setSelectedConversation}
			/>

			{selectedConversation ? (
				<ChatWindow
					conversation={selectedConversation}
					newMessage={newMessage}
					messagesEndRef={messagesEndRef}
					onMessageChange={setNewMessage}
					onSend={handleSendMessage}
				/>
			) : (
				<EmptyChat />
			)}
		</div>
	);
}
