import React, { useEffect, useState } from "react";
import DatePicker from "../date-picker/DatePicker";
import { toLocalDateValue } from "../date-picker/calendarUtils";

function getDefaultRecord(startYear) {
  return {
    id: null,
    name: `${startYear}-${startYear + 1}`,
    startDate: `${startYear}-09-01`,
    endDate: `${startYear + 1}-06-30`,
  };
}

function getYearFromDateValue(dateValue) {
  if (!dateValue) return null;

  return Number(dateValue.slice(0, 4));
}

function dateValueToLocalDate(dateValue) {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function dateValueToTimestamp(dateValue) {
  const date = dateValueToLocalDate(dateValue);

  if (!date) return null;

  return date.getTime();
}

function isStartDateInValidYear(dateValue, startYear) {
  return getYearFromDateValue(dateValue) === startYear;
}

function isEndDateInValidYear(dateValue, startYear) {
  return getYearFromDateValue(dateValue) === startYear + 1;
}

export default function SchoolYearRecordModal({
  isOpen,
  startYear,
  record,
  canCreate = true,
  isSaving = false,
  isDeleting = false,
  onClose,
  onSave,
  onDelete,
}) {
  const [formValue, setFormValue] = useState(getDefaultRecord(startYear));
  const [formError, setFormError] = useState("");

  const hasRecord = Boolean(record?.id);
  const isBusy = isSaving || isDeleting;

  const startDateMin = new Date(startYear, 0, 1);
  const startDateMax = new Date(startYear, 11, 31);
  const endDateMin = new Date(startYear + 1, 0, 1);
  const endDateMax = new Date(startYear + 1, 11, 31);

  useEffect(() => {
    if (!isOpen) return;

    setFormValue(record || getDefaultRecord(startYear));
    setFormError("");
  }, [isOpen, record, startYear]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isBusy) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleFormChange = (field, nextValue) => {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: nextValue,
    }));

    setFormError("");
  };

  const handleDateChange = (field, date) => {
    handleFormChange(field, toLocalDateValue(date));
  };

  const validateForm = (nextRecord) => {
    if (!hasRecord && !canCreate) {
      return "This school year cannot be created right now.";
    }

    if (!nextRecord.name) {
      return "Add a name for this interval.";
    }

    if (!nextRecord.startDate || !nextRecord.endDate) {
      return "Complete the start date and end date.";
    }

    if (!isStartDateInValidYear(nextRecord.startDate, startYear)) {
      return `The start date must be in ${startYear}.`;
    }

    if (!isEndDateInValidYear(nextRecord.endDate, startYear)) {
      return `The end date must be in ${startYear + 1}.`;
    }

    const startTimestamp = dateValueToTimestamp(nextRecord.startDate);
    const endTimestamp = dateValueToTimestamp(nextRecord.endDate);

    if (!startTimestamp || !endTimestamp) {
      return "Use valid dates.";
    }

    if (startTimestamp >= endTimestamp) {
      return "The start date must be before the end date.";
    }

    return "";
  };

  const handleSave = async () => {
    const nextRecord = {
      ...formValue,
      name: formValue.name.trim(),
      startDate: formValue.startDate,
      endDate: formValue.endDate,
    };

    const validationError = validateForm(nextRecord);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await onSave?.(startYear, nextRecord);
      onClose?.();
    } catch {
      setFormError("Could not save this school year.");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete?.(startYear);
      onClose?.();
    } catch {
      setFormError("Could not delete this school year.");
    }
  };

  const startDateValue = dateValueToLocalDate(formValue.startDate);
  const endDateValue = dateValueToLocalDate(formValue.endDate);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="School year form"
      onMouseDown={() => {
        if (!isBusy) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {hasRecord ? "Edit school year" : "Create school year"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure activity dates for {startYear} - {startYear + 1}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Name
            </label>

            <input
              value={formValue.name}
              disabled={isBusy}
              onChange={(event) => handleFormChange("name", event.target.value)}
              placeholder={`${startYear}-${startYear + 1}`}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DatePicker
              label="Start date"
              value={startDateValue}
              onChange={(date) => handleDateChange("startDate", date)}
              placeholder="No start date"
              locale="en-US"
              weekStartsOn={1}
              closeOnSelect
              showClear={false}
              showToday={false}
              disabled={isBusy}
              minDate={startDateMin}
              maxDate={startDateMax}
              className="max-w-none"
              popoverClassName="z-[120]"
            />

            <DatePicker
              label="End date"
              value={endDateValue}
              onChange={(date) => handleDateChange("endDate", date)}
              placeholder="No end date"
              locale="en-US"
              weekStartsOn={1}
              closeOnSelect
              showClear={false}
              showToday={false}
              disabled={isBusy}
              minDate={endDateMin}
              maxDate={endDateMax}
              className="max-w-none"
              popoverClassName="z-[120]"
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {hasRecord && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isBusy}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy || (!hasRecord && !canCreate)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : hasRecord ? "Save changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}