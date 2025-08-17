const WeekView = () => {
  const days = [
    { name: "Sun", date: 10, isToday: false },
    { name: "Mon", date: 11, isToday: false },
    { name: "Tue", date: 12, isToday: false },
    { name: "Wed", date: 13, isToday: false },
    { name: "Thu", date: 14, isToday: false },
    { name: "Fri", date: 15, isToday: false },
    { name: "Sat", date: 16, isToday: true },
  ];

  return (
    <div className="flex justify-between items-center gap-2">
      {days.map((day) => (
        <div key={day.name} className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-2 font-medium">
            {day.name}
          </span>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              day.isToday
                ? "bg-calendar-today text-white shadow-lg scale-105"
                : "bg-primary text-primary-foreground hover:bg-primary-glow hover:scale-105"
            }`}
          >
            {day.date}
          </div>
          <div className={`w-1 h-1 rounded-full mt-2 ${
            day.isToday ? "bg-calendar-today" : "bg-primary"
          }`} />
        </div>
      ))}
    </div>
  );
};

export { WeekView };