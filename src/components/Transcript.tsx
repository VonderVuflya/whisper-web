import { useRef, useEffect, useMemo, useCallback } from "react";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";

import { TranscribeData, TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../utils/AudioUtils";
import Ellipsis from "./Ellipsis";
import { Button } from "./ui/button";

interface Props {
    transcribedData: TranscriberData;
    isBusy?: boolean;
}

export default function Transcript({ transcribedData, isBusy }: Props) {
    const divRef = useRef<HTMLDivElement>(null);

    const formattedData = useMemo(() => {
        let result = [] as (TranscribeData & { fileName: string })[];

        for (let [fileName, data] of Object.entries(transcribedData)) {
            result.push({ ...data, fileName });
        }

        return result;
    }, [transcribedData]);
    console.log({ transcribedData, formattedData });

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        const csvContent = [
            ["Filename", "Transcription"],
            ...formattedData.map((r) => [r.fileName, r.text]),
        ]
            .map((row) => row.join(";"))
            .join("\n");

        navigator.clipboard.writeText(csvContent);

        toast("Success copy all!");
    };

    const copyCsv = () => {
        const csvContent = [
            ["Filename", "Transcription"],
            ...formattedData.map((r) => [r.fileName, r.text]),
        ]
            .map((row) => row.join(";"))
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        saveBlob(blob, "transcript.csv");
        toast("Success save csv!");
    };
    // const exportJSON = () => {
    // let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

    // post-process the JSON to make it more readable
    // const regex = /(    "timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
    // jsonData = jsonData.replace(regex, "$1[$2 $3]");

    // const blob = new Blob([jsonData], { type: "application/json" });
    // saveBlob(blob, "transcript.json");
    // };

    // Scroll to the bottom when the component updates
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                    divRef.current.scrollTop -
                    divRef.current.scrollHeight,
            );

            if (diff <= 64) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    const handleCopyClipboard = useCallback(
        (text: string, fileName: string) => {
            navigator.clipboard.writeText(text);

            toast("Success copy!", {
                description: `File: ${fileName}`,
            });
        },
        [toast],
    );

    return (
        <div
            ref={divRef}
            className='w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto'
        >
            {formattedData.length > 0 && (
                <>
                    {formattedData.map((trans, i) => (
                        <div
                            key={`${i}-${trans.fileName}`}
                            className='w-full flex flex-row mb-2 justify-between bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 dark:bg-background dark:shadow-black/10 dark:ring-border'
                        >
                            <div className='flex'>
                                <Ellipsis
                                    displayTooltip
                                    isMiddleEllipsis
                                    text={trans.fileName}
                                    className='mr-5 max-w-[120px] text-slate-600 dark:text-muted-foreground'
                                    charsToDisplayEnd={8}
                                    maxWidth={80}
                                />

                                <div className='dark:text-foreground'>
                                    {trans.text}
                                </div>
                            </div>

                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() =>
                                    handleCopyClipboard(
                                        trans.text,
                                        trans.fileName,
                                    )
                                }
                            >
                                <Clipboard className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all' />
                            </Button>
                        </div>
                    ))}

                    {!isBusy && (
                        <div className='w-full text-right'>
                            <button
                                onClick={copyToClipboard}
                                className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                            >
                                Copy all to Clipboard
                            </button>
                            <button
                                onClick={copyCsv}
                                className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                            >
                                Copy csv
                            </button>
                        </div>
                    )}
                </>
            )}
            {/* {transcribedData?.chunks &&
                transcribedData.chunks.map((chunk, i) => (
                    <div
                        key={`${i}-${transcribe.chunk.text}`}
                        className='w-full flex flex-row mb-2 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 dark:bg-background dark:shadow-black/10 dark:ring-border'
                    >
                        <div className='mr-5 text-slate-600 dark:text-muted-foreground'>
                            {formatAudioTimestamp(chunk.timestamp[0])}
                        </div>
                        <div className='dark:text-foreground'>{chunk.text}</div>
                    </div>
                ))} */}
            {/* {formattedData && !formattedData.isBusy && (
                <div className='w-full text-right'>
                    <button
                        onClick={copyFullText}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                    >
                        Copy full text
                    </button>
                    <button
                        onClick={exportTXT}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                    >
                        Export TXT
                    </button>
                    <button
                        onClick={exportJSON}
                        className='text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
                    >
                        Export JSON
                    </button>
                </div>
            )} */}
        </div>
    );
}
