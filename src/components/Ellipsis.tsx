import type { HTMLProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";

interface Props extends HTMLProps<HTMLSpanElement> {
    text: string;
    /**
     * number of characters you want to keep at the end: 6 will give “blablabla…bla.bla’”
     */
    charsToDisplayEnd?: number;
    className?: string;
    /**
     * when you embed it into something with title/tooltip, you might not want to display it
     */
    displayTitle?: boolean;
    /**
     * When text is too long, tooltip can be used to show the full text.
     */
    displayTooltip?: boolean;
    /**
     * Unless you REALLY know what you are doing (if you're using this component on RTL content ONLY for example)
     * leave this value to ltr, otherwise you can update it
     */
    direction?: string;
    maxWidth?: number;
    cutFileExtension?: boolean;
    isMiddleEllipsis?: boolean;
}

const Ellipsis = ({
    text,
    className = "",
    displayTitle = true,
    displayTooltip = false,
    charsToDisplayEnd = 6,
    direction = "ltr",
    maxWidth = 200,
    cutFileExtension = false,
    isMiddleEllipsis = false,
    ...rest
}: Props) => {
    const cuttedText = useMemo(
        () => (cutFileExtension ? text.split(".")[0] : text),
        [cutFileExtension, text],
    );

    const [start, end] = useMemo(() => {
        // Split text per characters and not bytes. For example, 👋🌍😊🐶 with
        // charsToDisplayEnd=3 would end up being 👋🌍� and �🐶 with simple
        // string slice. With array slice (because string iterator iterates per
        // characters), the results is as expected 👋 and 🌍😊🐶.
        // Note this doesn't work with all unicodes. For example, flags have
        // six bytes and even that is not handled properly by string iterator.
        return [
            [...cuttedText].slice(0, -charsToDisplayEnd).join(""),
            [...cuttedText].slice(-charsToDisplayEnd).join(""),
        ];
    }, [text, cutFileExtension, cuttedText]);

    const refSpan = useRef<HTMLSpanElement>(null);
    const refP = useRef<HTMLParagraphElement>(null);
    const [tooltipTitle, setTooltipTitle] = useState<string | null>(null);
    useEffect(() => {
        const currentRef = refSpan ?? refP;
        if (!displayTooltip || !currentRef.current) {
            return;
        }
        const textIsTooLong =
            currentRef.current.offsetWidth < currentRef.current.scrollWidth;
        if (textIsTooLong) {
            setTooltipTitle(text);
        } else {
            setTooltipTitle(null);
        }
    });

    console.log({ start, end });

    return (
        <TooltipProvider disableHoverableContent={displayTooltip}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isMiddleEllipsis ? (
                        <span
                            aria-label={text}
                            title={
                                displayTooltip
                                    ? undefined
                                    : displayTitle
                                    ? text
                                    : undefined
                            }
                            className={cn([
                                "inline-flex flex-nowrap max-w-full",
                                className,
                            ])}
                            dir={direction}
                            {...rest}
                        >
                            {start && (
                                <span
                                    ref={refSpan}
                                    className={`text-ellipsis text-pre max-w-[${maxWidth}px] whitespace-nowrap overflow-hidden`}
                                    aria-hidden='true'
                                >
                                    {start}
                                </span>
                            )}

                            <span
                                className='shrink-0 text-pre'
                                aria-hidden='true'
                            >
                                {end}
                            </span>
                        </span>
                    ) : (
                        <div className={className}>
                            <p
                                ref={refP}
                                className={`text-ellipsis overflow-hidden whitespace-nowrap`}
                            >
                                {cuttedText}
                            </p>
                        </div>
                    )}
                </TooltipTrigger>
                {displayTooltip && (
                    <TooltipContent>
                        <p>{tooltipTitle}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
};

export default Ellipsis;
