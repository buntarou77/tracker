function getDaysInMonth(year: number, month: number): number[] {
    const date = new Date(year, month, 1);
    const daysArr: number[] = [];
    while (date.getMonth() === month) {
      daysArr.push(date.getDate());
      date.setDate(date.getDate() + 1);
    }
    return daysArr;
}
export default getDaysInMonth;