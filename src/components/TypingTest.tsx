
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
  const [input, setInput] = useState("");
  const [time, setTime] = useState(60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState<boolean[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load a random paragraph
  const loadText = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    setText(sampleTexts[randomIndex]);
    
    // Initialize correctChars array
    setCorrectChars(Array(sampleTexts[randomIndex].length).fill(null));
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
    setCurrentCharIndex(0);
    
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
    
    // Show toast
    toast({
      title: "Test completed!",
      description: `Your typing speed: ${wpm} WPM with ${finalAccuracy}% accuracy`,
    });
  }, [charCount, errors, toast, wpm]);
  
  // Reset the test
  const resetTest = () => {
    setStatus("waiting");
    setInput("");
    setText("");
    setTime(60);
    setStartTime(null);
    setWordCount(0);
    setCharCount(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrentCharIndex(0);
    setCorrectChars([]);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== "running") return;
    
    const inputValue = e.target.value;
    const lastChar = inputValue.charAt(inputValue.length - 1);
    
    // Space handling for word count
    if (lastChar === " " && input.slice(-1) !== " ") {
      setWordCount((prev) => prev + 1);
    }
    
    // Track correctness of typed character
    const currChar = text[currentCharIndex];
    const isCorrect = lastChar === currChar;
    
    // Update correct chars array
    const newCorrectChars = [...correctChars];
    newCorrectChars[currentCharIndex] = isCorrect;
    setCorrectChars(newCorrectChars);
    
    // Update character count and error count
    setCharCount((prev) => prev + 1);
    if (!isCorrect) {
      setErrors((prev) => prev + 1);
    }
    
    // Update current character index
    setCurrentCharIndex((prev) => prev + 1);
    
    // Update input
    setInput(inputValue);
    
    // Calculate WPM and accuracy in real-time
    if (startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const currentWpm = Math.round(wordCount / (elapsedMinutes || 0.01));
      setWpm(currentWpm || 0);
      
      // Update accuracy
      const totalChars = charCount + 1; // +1 for current char
      const currentAccuracy = Math.max(0, Math.min(100, Math.round((1 - errors / totalChars) * 100)));
      setAccuracy(currentAccuracy);
    }
    
    // Check if reached end of text
    if (currentCharIndex >= text.length - 1) {
      endTest();
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
  
  // Render the text with highlighting for correct/incorrect chars
  const renderText = () => {
    if (!text) return null;
    
    return (
      <div className="typing-text-container w-full p-6 rounded-lg bg-card shadow-sm border">
        <p className="typing-text text-left">
          {text.split("").map((char, index) => {
            let className = "";
            
            if (index === currentCharIndex) {
              className = "typing-current";
            } else if (index < currentCharIndex) {
              className = correctChars[index] ? "typing-correct" : "typing-incorrect";
            }
            
            return (
              <span key={index} className={className}>
                {char}
              </span>
            );
          })}
          {currentCharIndex === text.length && <span className="typing-cursor"></span>}
        </p>
      </div>
    );
  };
  
  return (
    <div className="typing-test max-w-3xl w-full mx-auto space-y-8 animate-fade-in">
      {/* Timer & Progress */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-xl">{time}s</span>
        </div>
        <Progress 
          value={(time / 60) * 100} 
          className="w-full max-w-xs h-2 mx-4" 
        />
        {status === "running" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={endTest}
            className="text-xs hover:bg-destructive hover:text-destructive-foreground"
          >
            End Test
          </Button>
        )}
      </div>
      
      {/* Instructions */}
      {status === "waiting" && (
        <div className="text-center space-y-4 animate-slide-up">
          <h1 className="text-3xl font-light tracking-tight">Typing Speed Test</h1>
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
      
      {/* Text Display */}
      {status !== "waiting" && renderText()}
      
      {/* Input Field */}
      {status === "running" && (
        <div className="animate-slide-up">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className="w-full p-4 rounded-lg border bg-background focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:outline-none transition-all"
            placeholder="Start typing here..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
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
                {correctChars.filter(Boolean).length}
                <Check className="h-5 w-5 inline ml-1 text-green-500" />
              </div>
              <div className="stats-label">Correct</div>
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
