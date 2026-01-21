import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    fallback: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, fallback, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100",
                    className
                )}
                {...props}
            >
                {src ? (
                    <img
                        className="aspect-square h-full w-full object-cover"
                        src={src}
                        alt="Avatar"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {fallback}
                    </div>
                )}
            </div>
        );
    }
);
Avatar.displayName = "Avatar";
