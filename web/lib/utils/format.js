export function formatCurrency(amount) {
    // Hardcoded to Taka as per requirement
    // In a real app, might want Intl.NumberFormat with 'BDT' but symbol '৳' is requested explicitly.
    // Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }) usually gives BDT or Tk.
    // Let's manually format.
    const value = Number(amount);
    if (isNaN(value)) return "৳0.00";
    return `৳${value.toFixed(2)}`;
}
