import { useCallback, useMemo, useState } from "react";
import { useWorker } from "./useWorker";
import Constants from "../utils/Constants";

interface ProgressItem {
    file: string;
    loaded: number;
    progress: number;
    total: number;
    name: string;
    status: string;
}

interface TranscriberUpdateData {
    data: [
        string,
        { chunks: { text: string; timestamp: [number, number | null] }[] },
    ];
    text: string;
    fileName: string;
}

interface TranscriberCompleteData {
    data: {
        text: string;
        chunks: { text: string; timestamp: [number, number | null] }[];
    };
    fileName: string;
}

export type FileName = string;
export type TranscribeData = {
    isBusy: boolean;
    text: string;
    chunks: { text: string; timestamp: [number, number | null] }[];
};
export type TranscriberData = Record<FileName, TranscribeData>;

export interface Transcriber {
    onInputChange: () => void;
    isBusy: boolean;
    isModelLoading: boolean;
    progressItems: ProgressItem[];
    start: (audioData: AudioData | undefined) => void;
    output: TranscriberData;
    model: string;
    setModel: (model: string) => void;
    multilingual: boolean;
    setMultilingual: (model: boolean) => void;
    quantized: boolean;
    setQuantized: (model: boolean) => void;
    subtask: string;
    setSubtask: (subtask: string) => void;
    language?: string;
    setLanguage: (language: string) => void;
}

export enum AudioSource {
    URL = "URL",
    FILE = "FILE",
    RECORDING = "RECORDING",
}

export type AudioData = {
    buffer: AudioBuffer;
    url: string;
    source: AudioSource;
    mimeType: string;
    fileName: string;
}[];

export function useTranscriber(): Transcriber {
    const [transcript, setTranscript] = useState<TranscriberData>({});
    const [isBusy, setIsBusy] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);

    const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

    const webWorker = useWorker((event) => {
        const message = event.data;
        // Update the state with the result
        switch (message.status) {
            case "progress":
                // Model file progress: update one of the progress items.
                setProgressItems((prev) =>
                    prev.map((item) => {
                        if (item.file === message.file) {
                            return { ...item, progress: message.progress };
                        }
                        return item;
                    }),
                );
                break;
            case "update":
                // Received partial update
                // eslint-disable-next-line no-case-declarations
                const updateMessage = message as TranscriberUpdateData;

                setTranscript((prevState) => ({
                    ...prevState,
                    [updateMessage.fileName]: {
                        isBusy: true,
                        text: updateMessage.data[0],
                        chunks: updateMessage.data[1].chunks,
                    },
                }));
                break;
            case "complete":
                // Received complete transcript
                // console.log("complete", message);
                // eslint-disable-next-line no-case-declarations
                const completeMessage = message as TranscriberCompleteData;

                setTranscript((prevState) => ({
                    ...prevState,
                    [completeMessage.fileName]: {
                        isBusy: false,
                        text: completeMessage.data.text,
                        chunks: completeMessage.data.chunks,
                    },
                }));
                setIsBusy(false);
                break;

            case "initiate":
                // Model file start load: add a new progress item to the list.
                setIsModelLoading(true);
                setProgressItems((prev) => [...prev, message]);
                break;
            case "ready":
                setIsModelLoading(false);
                break;
            case "error":
                setIsBusy(false);
                alert(
                    `${message.data.message} This is most likely because you are using Safari on an M1/M2 Mac. Please try again from Chrome, Firefox, or Edge.\n\nIf this is not the case, please file a bug report.`,
                );
                break;
            case "done":
                // Model file loaded: remove the progress item from the list.
                setProgressItems((prev) =>
                    prev.filter((item) => item.file !== message.file),
                );
                break;

            default:
                // initiate/download/done
                break;
        }
    });

    const [model, setModel] = useState<string>(Constants.DEFAULT_MODEL);
    const [subtask, setSubtask] = useState<string>(Constants.DEFAULT_SUBTASK);
    const [quantized, setQuantized] = useState<boolean>(
        Constants.DEFAULT_QUANTIZED,
    );
    const [multilingual, setMultilingual] = useState<boolean>(
        Constants.DEFAULT_MULTILINGUAL,
    );
    const [language, setLanguage] = useState<string>(
        Constants.DEFAULT_LANGUAGE,
    );

    const onInputChange = useCallback(() => {
        setTranscript({});
    }, []);

    const postRequest = useCallback(
        async (audioData: AudioData | undefined) => {
            if (audioData) {
                setTranscript({});
                setIsBusy(true);

                audioData.forEach(async (data) => {
                    let audio;
                    if (data.buffer.numberOfChannels === 2) {
                        const SCALING_FACTOR = Math.sqrt(2);

                        let left = data.buffer.getChannelData(0);
                        let right = data.buffer.getChannelData(1);

                        audio = new Float32Array(left.length);
                        for (let i = 0; i < data.buffer.length; ++i) {
                            audio[i] =
                                (SCALING_FACTOR * (left[i] + right[i])) / 2;
                        }
                    } else {
                        // If the audio is not stereo, we can just use the first channel:
                        audio = data.buffer.getChannelData(0);
                    }

                    await webWorker.postMessage({
                        audio,
                        model,
                        multilingual,
                        quantized,
                        subtask: multilingual ? subtask : null,
                        language:
                            multilingual && language !== "auto"
                                ? language
                                : null,
                        fileName: data.fileName,
                    });
                });
            }
        },
        [webWorker, model, multilingual, quantized, subtask, language],
    );

    const transcriber = useMemo(() => {
        return {
            onInputChange,
            isBusy,
            isModelLoading,
            progressItems,
            start: postRequest,
            output: transcript,
            model,
            setModel,
            multilingual,
            setMultilingual,
            quantized,
            setQuantized,
            subtask,
            setSubtask,
            language,
            setLanguage,
        };
    }, [
        isBusy,
        isModelLoading,
        progressItems,
        postRequest,
        transcript,
        model,
        multilingual,
        quantized,
        subtask,
        language,
    ]);

    return transcriber;
}
