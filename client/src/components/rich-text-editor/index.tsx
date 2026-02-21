import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Redo,
	Strikethrough,
	Underline as UnderlineIcon,
	Undo,
} from "lucide-react";
import { useEffect } from "react";
import "./editor.css";
import { Button } from "@/ui/button";
import { cn } from "@/utils";

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function RichTextEditor({
	value,
	onChange,
	className,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Link.configure({ openOnClick: false }),
			Underline,
		],
		content: value,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "tiptap-editor focus:outline-none min-h-[200px] p-4",
			},
		},
	});

	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	if (!editor) return null;

	const addLink = () => {
		const url = window.prompt("Enter URL:");
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	};

	return (
		<div className={cn("border rounded-lg overflow-hidden", className)}>
			<div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					data-active={editor.isActive("heading", { level: 1 })}
				>
					<Heading1 className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					data-active={editor.isActive("heading", { level: 2 })}
				>
					<Heading2 className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					data-active={editor.isActive("heading", { level: 3 })}
				>
					<Heading3 className="h-4 w-4" />
				</Button>
				<div className="w-px h-8 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleBold().run()}
					data-active={editor.isActive("bold")}
				>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					data-active={editor.isActive("italic")}
				>
					<Italic className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					data-active={editor.isActive("underline")}
				>
					<UnderlineIcon className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					data-active={editor.isActive("strike")}
				>
					<Strikethrough className="h-4 w-4" />
				</Button>
				<div className="w-px h-8 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					data-active={editor.isActive("bulletList")}
				>
					<List className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					data-active={editor.isActive("orderedList")}
				>
					<ListOrdered className="h-4 w-4" />
				</Button>
				<div className="w-px h-8 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={addLink}
					data-active={editor.isActive("link")}
				>
					<LinkIcon className="h-4 w-4" />
				</Button>
				<div className="w-px h-8 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
				>
					<Undo className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
				>
					<Redo className="h-4 w-4" />
				</Button>
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}

export default RichTextEditor;
