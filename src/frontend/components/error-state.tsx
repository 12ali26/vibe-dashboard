type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <main className="center-state">
      <h1>Dashboard unavailable</h1>
      <p>{message}</p>
    </main>
  );
}
