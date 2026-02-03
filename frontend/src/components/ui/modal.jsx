import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4">
            <div
                className={cn(
                    "bg-background w-full max-w-lg rounded-2xl shadow-xl animate-slide-up border border-border flex flex-col max-h-[90vh]",
                    className
                )}
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

export { Modal }
