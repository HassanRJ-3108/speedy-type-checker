
import React from "react";
import TypingTest from "@/components/TypingTest";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50 flex flex-col">
      <header className="py-8">
        <div className="container max-w-5xl">
          <h1 className="text-4xl font-light text-center tracking-tight">
            <span className="text-accent font-normal">Speed</span>Type
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Test your typing speed and accuracy in 60 seconds
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-5xl px-4 py-8">
          <TypingTest />
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <div className="container max-w-5xl">
          <p>SpeedType &copy; {new Date().getFullYear()} - Improve your typing skills with practice</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
