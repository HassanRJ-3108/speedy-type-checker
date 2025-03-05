
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Sample paragraphs for typing test - expanded to provide more content
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Amazingly few discotheques provide jukeboxes. Sphinx of black quartz, judge my vow.",
  "A journey of a thousand miles begins with a single step. The best way to predict the future is to create it. Life is what happens when you're busy making other plans. Success is not final, failure is not fatal: It is the courage to continue that counts. The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "Technology is best when it brings people together. Innovation distinguishes between a leader and a follower. Simplicity is the ultimate sophistication. The only way to do great work is to love what you do. Your time is limited, so don't waste it living someone else's life. Stay hungry, stay foolish. Think different.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts. It always seems impossible until it's done. The only way to do great work is to love what you do. Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. The way to get started is to quit talking and begin doing. Your time is limited, so don't waste it living someone else's life. If life were predictable it would cease to be life, and be without flavor. In the end, it's not the years in your life that count. It's the life in your years."
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
  const [currCharIndex, setCurrCharIndex] = useState(0);
  const [currChar, setCurrChar] = useState("");
  const [correctChars, setCorrectChars] = useState<boolean[]>([]);
  const [completedWords, setCompletedWords] = useState<boolean[]>([]);
  const [visibleWordIndices, setVisibleWordIndices] = useState<number[]>([]);
  
  // Refs
  const testContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  
  // Load text and prepare for test
  const loadText = useCallback(() => {
    // Combine multiple paragraphs to create longer text
    const combinedText = sampleTexts.join(" ");
    setText(combinedText);
    
    // Split text into words
    const wordArray = combinedText.split(" ");
    setWords(wordArray);
    
    // Initialize completed words array
    setCompletedWords(Array(wordArray.length).fill(null));
    setCorrectChars(Array(wordArray[0]?.length || 0).fill(null));
    
    // Set initial visible words (e.g., first 15 words)
    const initialVisible = Array.from({ length: Math.min(15, wordArray.length) }, (_, i) => i);
    setVisibleWordIndices(initialVisible);
  }, []);
  
  // Start the test
  const startTest = () => {
    loadText();
    setStatus("running");
    setTime(60);
    setStartTime(Date.now());
    setWordCount(0);
    setCharCount(0);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrWordIndex(0);
    setCurrCharIndex(0);
    setCurrChar("");
    
    // Set focus to the test container
    if (testContainerRef.current) {
      testContainerRef.current.focus();
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
    setCurrCharIndex(0);
    setCurrChar("");
    setCompletedWords([]);
    setCorrectChars([]);
    setVisibleWordIndices([]);
  };
  
  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (status !== "running") {
      if (e.key === "Enter") {
        startTest();
      }
      return;
    }
    
    // Get the current word
    const currentWord = words[currWordIndex];
    
    // Prevent default for some keys to avoid browser shortcuts
    if ([" ", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    
    // Handle key press
    if (e.key === "Escape") {
      resetTest();
    } else if (e.key === " ") {
      // Space pressed, check if word is complete and move to next word
      const isWordCorrect = currCharIndex === currentWord.length;
      
      // Update completed words array
      const newCompletedWords = [...completedWords];
      newCompletedWords[currWordIndex] = isWordCorrect;
      setCompletedWords(newCompletedWords);
      
      // Update character count
      setCharCount(prev => prev + currentWord.length + 1); // +1 for space
      
      // Update error count
      if (!isWordCorrect) {
        setErrors(prev => prev + (currentWord.length - currCharIndex) + 
          correctChars.filter(correct => correct === false).length);
      }
      
      // Move to next word
      const nextWordIndex = currWordIndex + 1;
      
      // Load more words if running out
      if (nextWordIndex > visibleWordIndices[5] && nextWordIndex < words.length - 5) {
        const newVisibleIndices = [];
        for (let i = nextWordIndex - 5; i < nextWordIndex + 10; i++) {
          if (i >= 0 && i < words.length) {
            newVisibleIndices.push(i);
          }
        }
        setVisibleWordIndices(newVisibleIndices);
      }
      
      // Check if we're near the end of available words
      if (nextWordIndex >= words.length - 10 && words.length < 1000) {
        // Add more words by repeating the samples
        const additionalText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        const additionalWords = additionalText.split(" ");
        
        setWords(prevWords => [...prevWords, ...additionalWords]);
        setCompletedWords(prevCompleted => [...prevCompleted, ...Array(additionalWords.length).fill(null)]);
      }
      
      setCurrWordIndex(nextWordIndex);
      setCurrCharIndex(0);
      setWordCount(prev => prev + 1);
      
      // Reset correct chars for the next word
      const nextWord = words[nextWordIndex];
      setCorrectChars(Array(nextWord?.length || 0).fill(null));
      
      // Calculate WPM in real-time
      if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const currentWpm = Math.round((wordCount + 1) / (elapsedMinutes || 0.01));
        setWpm(currentWpm || 0);
        
        // Update accuracy
        const currentAccuracy = Math.max(0, Math.min(100, Math.round((1 - errors / (charCount + currentWord.length + 1)) * 100)));
        setAccuracy(currentAccuracy);
      }
    } else if (e.key === "Backspace") {
      // Backspace pressed, remove previous character
      if (currCharIndex > 0) {
        setCurrCharIndex(currCharIndex - 1);
        
        // Update correct chars
        const newCorrectChars = [...correctChars];
        newCorrectChars[currCharIndex - 1] = null;
        setCorrectChars(newCorrectChars);
      }
    } else if (e.key.length === 1) {
      // Regular character typed
      const expectedChar = currentWord[currCharIndex];
      const isCorrect = e.key === expectedChar;
      
      // Update correct chars
      const newCorrectChars = [...correctChars];
      newCorrectChars[currCharIndex] = isCorrect;
      setCorrectChars(newCorrectChars);
      
      // Move to next character
      setCurrCharIndex(currCharIndex + 1);
      setCurrChar(e.key);
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
  
  // Render the words for typing
  const renderWords = () => {
    if (!words.length) return null;
    
    return (
      <div className="typing-area relative flex justify-center items-center h-16 overflow-hidden bg-card rounded-lg shadow-sm border">
        <div 
          ref={wordContainerRef}
          className="words-container flex items-center absolute transition-all duration-200"
          style={{ transform: `translateX(calc(50% - ${(currWordIndex - visibleWordIndices[0]) * 4}rem))` }}
        >
          {words.map((word, index) => {
            // Only render visible words
            if (!visibleWordIndices.includes(index)) return null;
            
            let wordClassName = "mx-1 py-1 px-2 rounded transition-all duration-100 flex whitespace-nowrap";
            
            if (index === currWordIndex) {
              wordClassName += " bg-primary/10";
            } else if (index < currWordIndex) {
              wordClassName += completedWords[index] 
                ? " text-muted-foreground" 
                : " text-red-500/50 line-through";
            } else {
              wordClassName += " text-foreground/80";
            }
            
            return (
              <div key={index} className={wordClassName}>
                {word.split("").map((char, charIndex) => {
                  let charClassName = "transition-all";
                  
                  if (index === currWordIndex) {
                    if (charIndex === currCharIndex) {
                      charClassName += " relative";
                    }
                    if (charIndex < currCharIndex) {
                      charClassName += correctChars[charIndex] 
                        ? " text-green-600 dark:text-green-400"
                        : " text-red-600 dark:text-red-400 underline";
                    }
                  }
                  
                  return (
                    <span key={charIndex} className={charClassName}>
                      {char}
                      {index === currWordIndex && charIndex === currCharIndex && (
                        <span className="absolute h-5 w-0.5 bg-primary animate-pulse-soft bottom-0 left-0"></span>
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
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
            Type the text as it appears in the center. Words flow from right to left. Press space to continue to the next word.
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
      {status !== "waiting" && (
        <div 
          ref={testContainerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
        >
          {renderWords()}
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
