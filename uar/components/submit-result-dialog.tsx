"use client";

import { motion } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

type Variant = "success" | "error";

interface Props {
    open: boolean;
    variant: Variant;
    title: string;
    description?: string;
    onClose: () => void;
}

export function SubmitResultDialog({
    open,
    variant,
    title,
    description,
    onClose,
}: Props) {
    const isSuccess = variant === "success";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <VisuallyHidden>
                    <DialogTitle>{title}</DialogTitle>
                </VisuallyHidden>

                {description && (
                    <VisuallyHidden>
                        <DialogDescription>{description}</DialogDescription>
                    </VisuallyHidden>
                )}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex flex-col items-center text-center gap-4 py-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: 0.15,
                            type: "spring",
                            stiffness: 220,
                        }}
                        className={isSuccess ? "text-primary" : "text-destructive"}
                    >
                        {isSuccess ? (
                            <CheckCircle2 className="w-16 h-16" />
                        ) : (
                            <XCircle className="w-16 h-16" />
                        )}
                    </motion.div>

                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-foreground">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    <Button
                        variant={isSuccess ? "default" : "destructive"}
                        className="mt-4 w-full"
                        onClick={onClose}
                    >
                        OK
                    </Button>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
