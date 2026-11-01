import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";

interface DynamicCalendarProps {
  selected: Date;
  onDateSelect: (date: Date) => void;
  t: (key: string) => string;
  locale: Locale;
}

const DynamicCalendar: React.FC<DynamicCalendarProps> = ({ 
  selected: selectedDate,
  onDateSelect,
  t,
  locale
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    setCurrentMonth(selectedDate || new Date());
  }, [selectedDate]);

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of the day
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    onDateSelect(day);
  };

  const renderHeader = () => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={prevMonth} style={buttonStyle} aria-label="Previous Month">{"◀"}</button>
        <div style={{ fontWeight: "600", fontSize: 18, color: "#222" }}>
          {format(currentMonth, "MMMM yyyy", { locale })}
        </div>
        <button onClick={nextMonth} style={buttonStyle} aria-label="Next Month">{"▶"}</button>
      </div>
    );
  };

  const renderDays = () => {
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {dayNames.map(day => (
          <div key={day} style={{ width: 30, textAlign: "center", fontWeight: "500", color: "#777", userSelect: "none", fontSize: '12px' }}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale });
    const endDate = endOfWeek(monthEnd, { locale });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        days.push(
          <div
            key={day.toString()}
            onClick={() => isCurrentMonth && onDateClick(cloneDay)}
            style={{
              width: 30,
              height: 30,
              margin: 2,
              lineHeight: "30px",
              textAlign: "center",
              borderRadius: "50%",
              cursor: isCurrentMonth ? "pointer" : "default",
              backgroundColor: isSelected ? "#007AFF" : "transparent",
              color: isCurrentMonth ? (isSelected ? "#FFF" : "#000") : "#CCC",
              fontWeight: isSelected ? "600" : "400",
              userSelect: "none",
              transition: "background-color 0.2s ease"
            }}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: "flex", justifyContent: "space-between" }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#007AFF",
    fontWeight: "bold",
    userSelect: "none"
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: 260,
        padding: 10,
        userSelect: "none",
      }}
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div style={{ margin: "0px", textAlign: "right" }}>
        <button
          onClick={goToToday}
          style={{
            backgroundColor: "transparent",
            color: "#007AFF",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: "600",
          }}
        >
          {t('today')}
        </button>
      </div>
    </div>
  );
};

export default DynamicCalendar;