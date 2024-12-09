import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { AudioManager } from "./components/AudioManager";
import Transcript from "./components/Transcript";
import { useTranscriber } from "./hooks/useTranscriber";

function App() {
    const transcriber = useTranscriber();

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div className='flex justify-center items-center min-h-screen'>
                <div className='absolute top-4 right-4'>
                    <ModeToggle />
                </div>
                <div className='container flex flex-col justify-center items-center'>
                    <h1 className='text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl text-center'>
                        Whisper Web
                    </h1>
                    <h2 className='mt-3 mb-5 px-4 text-center text-1xl font-semibold tracking-tight text-muted-foreground sm:text-2xl'>
                        ML-powered speech recognition directly in your browser
                    </h2>
                    <AudioManager transcriber={transcriber} />
                    <Transcript transcribedData={transcriber.output} />
                </div>

                <div className='absolute bottom-4'>
                    Made with{" "}
                    <a
                        className='underline'
                        href='https://github.com/xenova/transformers.js'
                    >
                        🤗 Transformers.js
                    </a>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;
