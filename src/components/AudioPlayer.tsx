import { useEffect, useRef } from "react";

export default function AudioPlayer(props: {
    audioUrl: string;
    mimeType: string;
    fileName?: string;
}) {
    const audioPlayer = useRef<HTMLAudioElement>(null);
    const audioSource = useRef<HTMLSourceElement>(null);

    // Updates src when url changes
    useEffect(() => {
        if (audioPlayer.current && audioSource.current) {
            audioSource.current.src = props.audioUrl;
            audioPlayer.current.load();
        }
    }, [props.audioUrl]);

    return (
        <div className='flex flex-col gap-2 relative z-10 p-4 w-full'>
            {props.fileName && (
                <div className='text-sm text-slate-600 font-medium truncate px-2 dark:text-muted-foreground'>
                    {props.fileName}
                </div>
            )}
            <audio
                ref={audioPlayer}
                controls
                className='w-full h-14 bg-white rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 dark:bg-background dark:shadow-black/10 dark:ring-border'
            >
                <source ref={audioSource} type={props.mimeType}></source>
            </audio>
        </div>
    );
}
