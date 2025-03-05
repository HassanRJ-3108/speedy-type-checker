
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Check, X, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Sample paragraphs for typing test
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
  "A journey of a thousand miles begins with a single step. The best way to predict the future is to create it. Life is what happens when you're busy making other plans.",
  "Technology is best when it brings people together. Innovation distinguishes between a leader and a follower. Simplicity is the ultimate sophistication.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts. It always seems impossible until it's done. The only way to do great work is to love what you do.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. The way to get started is to quit talking and begin doing. Your time is limited, so don't waste it living someone else's life."
];

type TestStatus = "waiting" | "running" | "finished";

const TypingTest: React.FC = () => {
  const { toast } = useToast();
  
  // State
  const [status, setStatus] = useState<TestStatus>("waiting");
  const [text, setText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [time, setTime] = useState(60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [currWordIndex, setCurrWordIndex] = useState(0);
  const [currWordCorrectness, setCurrWordCorrectness] = useState<boolean | null>(null);
  const [completedWords, setCompletedWords] = useState<boolean[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);
  
  // Load a random paragraph and split it into words
  const loadText = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    const selectedText = sampleTexts[randomIndex];
    setText(selectedText);
    
    // Split text into words
    const wordArray = selectedText.split(" ");
    setWords(wordArray);
    
    // Initialize completedWords array
    setCompletedWords(Array(wordArray.length).fill(null));
  }, []);
  
  // Start the test
  const startTest = () => {
    loadText();
    setStatus("running");
    setInput("");
    setTime(60);
    setStartTime(Date.now());
    setWordCount(0);
    setCharCount(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrWordIndex(0);
    setCurrWordCorrectness(null);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          endTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  // End the test
  const endTest = useCallback(() => {
    setStatus("finished");
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Calculate final stats
    const totalChars = charCount;
    const totalErrors = errors;
    const finalAccuracy = totalChars > 0 
      ? Math.max(0, Math.min(100, Math.round((1 - totalErrors / totalChars) * 100))) 
      : 100;
      
    setAccuracy(finalAccuracy);
    
    // Show toast with timeout to avoid React warning
    setTimeout(() => {
      toast({
        title: "Test completed!",
        description: `Your typing speed: ${wpm} WPM with ${finalAccuracy}% accuracy`,
      });
    }, 0);
  }, [charCount, errors, toast, wpm]);
  
  // Reset the test
  const resetTest = () => {
    setStatus("waiting");
    setInput("");
    setText("");
    setWords([]);
    setTime(60);
    setStartTime(null);
    setWordCount(0);
    setCharCount(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrWordIndex(0);
    setCurrWordCorrectness(null);
    setCompletedWords([]);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== "running") return;
    
    const inputValue = e.target.value;
    setInput(inputValue);
    
    const currentWord = words[currWordIndex];
    const inputWithoutSpace = inputValue.trim();
    
    // Check if the current word is being typed correctly
    const isCorrect = currentWord.startsWith(inputWithoutSpace);
    setCurrWordCorrectness(isCorrect);
    
    // Check if space was pressed (word completed)
    if (inputValue.endsWith(" ")) {
      // Word is complete, move to next word
      const isWordCorrect = inputWithoutSpace === currentWord;
      
      // Update completed words array
      const newCompletedWords = [...completedWords];
      newCompletedWords[currWordIndex] = isWordCorrect;
      setCompletedWords(newCompletedWords);
      
      // Update character count
      setCharCount(prev => prev + currentWord.length + 1); // +1 for space
      
      // Update error count
      if (!isWordCorrect) {
        setErrors(prev => prev + 1);
      }
      
      // Move to next word
      setCurrWordIndex(prev => prev + 1);
      setWordCount(prev => prev + 1);
      setCurrWordCorrectness(null);
      setInput(""); // Clear input for next word
      
      // Calculate WPM in real-time
      if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const currentWpm = Math.round((wordCount + 1) / (elapsedMinutes || 0.01));
        setWpm(currentWpm || 0);
        
        // Update accuracy
        const currentAccuracy = Math.max(0, Math.min(100, Math.round((1 - errors / (charCount + currentWord.length + 1)) * 100)));
        setAccuracy(currentAccuracy);
      }
      
      // Check if reached end of text
      if (currWordIndex >= words.length - 1) {
        endTest();
      }
    }
  };
  
  // Handle key down for shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      resetTest();
    } else if (e.key === "Enter" && status === "waiting") {
      startTest();
    }
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Render the words with highlighting for correct/incorrect words
  const renderWords = () => {
    if (!words.length) return null;
    
    return (
      <div 
        ref={testContainerRef}
        className="typing-test-container relative w-full overflow-hidden h-16 flex items-center justify-center bg-card rounded-lg shadow-sm border"
      >
        <div className="word-container flex items-center absolute transition-transform duration-200" 
          style={{ transform: `translateX(calc(50% - ${currWordIndex * 8}rem))` }}>
          {words.map((word, index) => {
            let className = "mx-2 py-1 px-2 rounded transition-all duration-100 whitespace-nowrap";
            
            if (index === currWordIndex) {
              className += " bg-primary/10 border-b-2 border-primary";
            } else if (index < currWordIndex) {
              className += completedWords[index] ? " text-green-600 dark:text-green-400" : " text-red-600 dark:text-red-400 line-through";
            } else {
              className += " text-muted-foreground";
            }
            
            return (
              <div key={index} className={className}>
                {word}
              </div>
            );
          })}
        </div>
        <div className="absolute pointer-events-none w-px h-6 bg-primary animate-pulse"></div>
      </div>
    );
  };
  
  return (
    <div className="typing-test max-w-3xl w-full mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-light tracking-tight">
          Test your typing skills
        </h1>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card p-4 rounded-lg bg-card border text-center relative overflow-hidden">
          <div className="stats-value flex justify-center items-center">
            {time}
          </div>
          <div className="stats-label">seconds</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 -z-10" viewBox="0 0 100 100">
              <circle
                className="text-muted stroke-current"
                strokeWidth="4"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary stroke-current"
                strokeWidth="4"
                strokeLinecap="round"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
                strokeDasharray="239.77"
                strokeDashoffset={239.77 * (1 - time / 60)}
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </div>
            
        <div className="stat-card p-4 rounded-lg bg-card border text-center">
          <div className="stats-value">{wpm}</div>
          <div className="stats-label">words/min</div>
        </div>
            
        <div className="stat-card p-4 rounded-lg bg-card border text-center">
          <div className="stats-value">{charCount}</div>
          <div className="stats-label">chars/min</div>
        </div>
            
        <div className="stat-card p-4 rounded-lg bg-card border text-center">
          <div className="stats-value flex justify-center items-center">
            {accuracy}
            <Percent className="h-5 w-5 inline ml-1 text-muted-foreground" />
          </div>
          <div className="stats-label">accuracy</div>
        </div>
      </div>
      
      {/* Instructions */}
      {status === "waiting" && (
        <div className="text-center space-y-4 animate-slide-up">
          <p className="text-muted-foreground">
            Type the text below as fast and accurately as you can. You have 60 seconds.
          </p>
          <Button 
            onClick={startTest} 
            className="mt-4 transition-all hover:scale-105 active:scale-95"
          >
            Start Test
          </Button>
        </div>
      )}
      
      {/* Words Display */}
      {status !== "waiting" && renderWords()}
      
      {/* Input Field */}
      {status === "running" && (
        <div className="animate-slide-up">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`w-full p-4 rounded-lg border transition-all ${
              currWordCorrectness === false ? "border-red-500 bg-red-50 dark:bg-red-900/20" : 
              currWordCorrectness === true ? "border-green-500 bg-green-50 dark:bg-green-900/20" : 
              "bg-background border-border"
            }`}
            placeholder="Type here..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      )}
      
      {/* Controls */}
      {status === "running" && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={endTest}
            className="text-xs hover:bg-destructive hover:text-destructive-foreground"
          >
            End Test
          </Button>
        </div>
      )}
      
      {/* Results */}
      {status === "finished" && (
        <div className="results-container space-y-6 animate-scale-in">
          <h2 className="text-2xl font-light">Your Results</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card p-4 rounded-lg bg-card border text-center">
              <div className="stats-value">{wpm}</div>
              <div className="stats-label">WPM</div>
            </div>
            
            <div className="stat-card p-4 rounded-lg bg-card border text-center">
              <div className="stats-value flex justify-center items-center">
                {accuracy}
                <Percent className="h-5 w-5 inline ml-1 text-muted-foreground" />
              </div>
              <div className="stats-label">Accuracy</div>
            </div>
            
            <div className="stat-card p-4 rounded-lg bg-card border text-center">
              <div className="stats-value flex justify-center items-center">
                {wordCount - errors}
                <Check className="h-5 w-5 inline ml-1 text-green-500" />
              </div>
              <div className="stats-label">Correct Words</div>
            </div>
            
            <div className="stat-card p-4 rounded-lg bg-card border text-center">
              <div className="stats-value flex justify-center items-center">
                {errors}
                <X className="h-5 w-5 inline ml-1 text-red-500" />
              </div>
              <div className="stats-label">Errors</div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={startTest} className="px-8">
              Try Again
            </Button>
            <Button variant="outline" onClick={resetTest}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingTest;
