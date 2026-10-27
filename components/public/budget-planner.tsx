"use client";

import { useMemo, useState, type FormEvent } from "react";

export type PlannerPackage = {
  id: string;
  name: string;
  summary: string | null;
  priceAmount: number | null;
  priceLabel: string | null;
  currency: string;
  features: string[];
};

const allocation = [
  ["Crew and production direction", 35],
  ["Technical, equipment, and venue", 30],
  ["Content, edit, and finishing", 20],
  ["Contingency and delivery", 15],
] as const;

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en-NG")}`;
  }
}

export function BudgetPlanner({ packages }: { packages: PlannerPackage[] }) {
  const [budgetInput, setBudgetInput] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [submittedBudget, setSubmittedBudget] = useState<number | null>(null);
  const [error, setError] = useState("");

  const priced = useMemo(
    () => packages.filter((entry) => entry.priceAmount !== null && entry.priceAmount > 0),
    [packages],
  );
  const matching = useMemo(() => {
    if (submittedBudget === null) return [];
    return priced
      .filter((entry) => entry.currency === currency && entry.priceAmount! <= submittedBudget)
      .sort((a, b) => b.priceAmount! - a.priceAmount!);
  }, [currency, priced, submittedBudget]);
  const nextUp = useMemo(() => {
    if (submittedBudget === null) return undefined;
    return priced
      .filter((entry) => entry.currency === currency && entry.priceAmount! > submittedBudget)
      .sort((a, b) => a.priceAmount! - b.priceAmount!)[0];
  }, [currency, priced, submittedBudget]);

  function submitBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(budgetInput.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a budget greater than zero.");
      setSubmittedBudget(null);
      return;
    }
    setError("");
    setSubmittedBudget(Math.round(amount));
  }

  return (
    <section className="budget-planner" aria-labelledby="budget-planner-title">
      <div className="budget-planner-copy">
        <p className="eyebrow">BUDGET PLANNER · DRAFT</p>
        <h2 id="budget-planner-title">Start with<br /><em>your number.</em></h2>
        <p>Tell us what you have in mind. We will show how that budget could be shaped across crew, technical production, content, and delivery. This is planning guidance, not a quote or an approved rate card.</p>
        <span className="draft-tag">NO APPROVED PACKAGE RATES PUBLISHED YET</span>
      </div>

      <div className="budget-planner-panel">
        <form className="budget-form" onSubmit={submitBudget}>
          <div className="budget-field budget-field-amount">
            <label htmlFor="budget-amount">Your budget</label>
            <input
              id="budget-amount"
              inputMode="decimal"
              min="1"
              name="budget"
              onChange={(event) => setBudgetInput(event.target.value)}
              placeholder="e.g. 2,500,000"
              step="1000"
              type="number"
              value={budgetInput}
              aria-describedby={error ? "budget-error" : "budget-help"}
              aria-invalid={error ? true : undefined}
            />
          </div>
          <div className="budget-field">
            <label htmlFor="budget-currency">Currency</label>
            <select id="budget-currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <button type="submit">SHAPE MY BUDGET ↗</button>
        </form>
        <p className="budget-help" id="budget-help">No payment is taken and nothing is published publicly.</p>
        {error && <p className="budget-error" id="budget-error" role="alert">{error}</p>}

        {submittedBudget !== null && (
          <div className="budget-result" role="status">
            <div className="budget-result-heading">
              <span className="eyebrow">PLANNING SNAPSHOT</span>
              <strong>{money(submittedBudget, currency)}</strong>
            </div>
            <div className="budget-allocation">
              {allocation.map(([label, percentage]) => (
                <div key={label}>
                  <span>{label}</span>
                  <span>{percentage}%</span>
                  <strong>{money((submittedBudget * percentage) / 100, currency)}</strong>
                </div>
              ))}
            </div>

            {matching.length > 0 ? (
              <div className="budget-match">
                <p className="eyebrow">CLOSEST APPROVED PACKAGE</p>
                <h3>{matching[0].name}</h3>
                {matching[0].summary && <p>{matching[0].summary}</p>}
                <p className="budget-match-price">{matching[0].priceLabel || money(matching[0].priceAmount!, matching[0].currency)}</p>
                {matching.length > 1 && <p className="budget-help">Also within this range: {matching.slice(1, 4).map((entry) => entry.name).join(", ")}.</p>}
              </div>
            ) : (
              <div className="budget-match">
                <p className="eyebrow">CUSTOM SCOPE</p>
                <h3>We will build around the brief.</h3>
                <p>{priced.length > 0 ? "No approved package sits inside this budget yet. The team can still shape a smaller scope or a phased plan." : "Approved package rates are not published yet, so no automatic package match is available. Your budget can still become a useful starting brief."}</p>
                {nextUp && <p className="budget-help">The nearest approved package above this budget is {nextUp.name} at {nextUp.priceLabel || money(nextUp.priceAmount!, nextUp.currency)}.</p>}
              </div>
            )}

            <a className="budget-cta" href={`/request-quote?budget=${submittedBudget}&currency=${currency}`}>
              Take this budget into a project inquiry <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
