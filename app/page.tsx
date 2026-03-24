"use client"

import { useState, useMemo } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Wallet, Percent, Calendar, Target, TableIcon, Hash, Plus, Trash2, Gift, Download, Image } from "lucide-react"
import { useRef, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const chartConfig = {
  activeIncome: {
    label: "รายได้เชิงรุก (Active)",
    color: "hsl(0, 84%, 60%)",
  },
  passiveIncome: {
    label: "มูลค่าพอร์ต (Portfolio)",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

const monthlyChartConfig = {
  monthlySalary: {
    label: "เงินเดือน/เดือน",
    color: "hsl(0, 84%, 60%)",
  },
  monthlyDividend: {
    label: "ปันผล/เดือน",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

export default function EasyCompoundingPage() {
  // Refs for export
  const exportRef = useRef<HTMLDivElement>(null)
  
  // User inputs - allow empty string for better UX
  const [userName, setUserName] = useState("") // ชื่อผู้ใช้
  const [initialInvestment, setInitialInvestment] = useState<number | "">(200000) // เงินต้นที่มีอยู่
  const [investmentPercent, setInvestmentPercent] = useState<number | "">(30) // % ของเงินเดือนที่ออม
  const [baseMonthlyInvestment, setBaseMonthlyInvestment] = useState<number | "">(0) // ขั้นต่ำที่ลงทุนต่อเดือน
  const [growthRate, setGrowthRate] = useState<number | "">(8) // % ผลตอบแทนการลงทุนต่อปี
  const [dividendYield, setDividendYield] = useState<number | "">(5) // % ปันผลต่อปี
  const [monthlySalary, setMonthlySalary] = useState<number | "">(60000) // เงินเดือนเริ่มต้น
  const [salaryGrowthRate, setSalaryGrowthRate] = useState<number | "">(5) // % การเพิ่มขึ้นของเงินเดือนต่อปี
  const [salaryGrowthMode, setSalaryGrowthMode] = useState<"linear" | "bellcurve">("linear") // โหมดการเติบโตของเงินเดือน
  const [salaryDeclineRate, setSalaryDeclineRate] = useState<number | "">(3) // % การลดลงของเงินเดือนหลังจากอายุสูงสุด
  const [maxSalary, setMaxSalary] = useState<number | "">(150000) // เงินเดือนสูงสุดที่คาดว่าจะได้
  const [peakSalaryAge, setPeakSalaryAge] = useState<number | "">(45) // อายุที่เงินเดือนสูงสุด
  const [declineStartAge, setDeclineStartAge] = useState<number | "">(50) // อายุที่เงินเดือนเริ่มถดถอย
  const [startAge, setStartAge] = useState<number | "">(23) // ปีเริ่มต้น
  const [retirementAge, setRetirementAge] = useState<number | "">(60) // ปีที่เกษียณ
  const [showDetailedNumbers, setShowDetailedNumbers] = useState(true) // Toggle between K/M and full numbers - default to detailed
  
  // Lump sum list - เงินก้อนพิเศษ
  const [lumpSumList, setLumpSumList] = useState<Array<{ id: number; age: number; amount: number; note: string }>>([])
  const [newLumpSumAge, setNewLumpSumAge] = useState<number | "">("")
  const [newLumpSumAmount, setNewLumpSumAmount] = useState<number | "">("")
  const [newLumpSumNote, setNewLumpSumNote] = useState("")
  
  // Convert lump sum list to extraIncomeByAge map
  const extraIncomeByAge = useMemo(() => {
    const map: Record<number, number> = {}
    lumpSumList.forEach(item => {
      map[item.age] = (map[item.age] || 0) + item.amount
    })
    return map
  }, [lumpSumList])
  
  // Add new lump sum
  const addLumpSum = () => {
    if (newLumpSumAge === "" || newLumpSumAmount === "" || newLumpSumAmount <= 0) return
    const age = Number(newLumpSumAge)
    if (age < numStartAge || age > numRetirementAge) return
    
    setLumpSumList(prev => [
      ...prev,
      { id: Date.now(), age, amount: Number(newLumpSumAmount), note: newLumpSumNote || "เงินพิเศษ" }
    ])
    setNewLumpSumAge("")
    setNewLumpSumAmount("")
    setNewLumpSumNote("")
  }
  
  // Remove lump sum
  const removeLumpSum = (id: number) => {
    setLumpSumList(prev => prev.filter(item => item.id !== id))
  }

  // Export to PDF/Print function
  const exportToPrint = useCallback(() => {
    window.print()
  }, [])

  // Global number formatter based on toggle
  const formatNumber = (num: number, forceShort = false) => {
    if (showDetailedNumbers && !forceShort) {
      return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toLocaleString()
  }

  // Helper to parse input - returns number or empty string
  const parseInput = (value: string): number | "" => {
    if (value === "") return ""
    const num = Number(value)
    return isNaN(num) ? "" : num
  }

  // Get numeric value with fallback for calculations
  const getNumericValue = (val: number | "", fallback: number): number => {
    return val === "" ? fallback : val
  }

  // Numeric values for calculations
  const numInitialInvestment = getNumericValue(initialInvestment, 0)
  const numInvestmentPercent = getNumericValue(investmentPercent, 30)
  const numBaseMonthlyInvestment = getNumericValue(baseMonthlyInvestment, 0)
  const numGrowthRate = getNumericValue(growthRate, 8)
  const numDividendYield = getNumericValue(dividendYield, 5)
  const numMonthlySalary = getNumericValue(monthlySalary, 60000)
  const numSalaryGrowthRate = getNumericValue(salaryGrowthRate, 5)
  const numSalaryDeclineRate = getNumericValue(salaryDeclineRate, 3)
  const numMaxSalary = getNumericValue(maxSalary, 150000)
  const numPeakSalaryAge = getNumericValue(peakSalaryAge, 45)
  const numDeclineStartAge = getNumericValue(declineStartAge, 50)
  const numStartAge = getNumericValue(startAge, 23)
  const numRetirementAge = getNumericValue(retirementAge, 60)

  // Helper function to calculate monthly salary at a given age
  const getMonthlySalaryAtAge = (age: number, yearIndex: number): number => {
    if (salaryGrowthMode === "linear") {
      // Linear growth mode with peak and decline
      if (age <= numPeakSalaryAge) {
        // Growth phase: เงินเดือน × (1 + อัตราเพิ่ม)^ปี
        return numMonthlySalary * Math.pow(1 + numSalaryGrowthRate / 100, yearIndex)
      } else {
        // Decline phase: ลดลงจากจุดสูงสุด
        const yearsAtPeak = numPeakSalaryAge - numStartAge
        const peakSalary = numMonthlySalary * Math.pow(1 + numSalaryGrowthRate / 100, yearsAtPeak)
        const yearsAfterPeak = age - numPeakSalaryAge
        // ลดลงตาม % ที่กำหนด แต่ไม่ต่ำกว่า 40% ของเงินเดือนสูงสุด
        const declinedSalary = peakSalary * Math.pow(1 - numSalaryDeclineRate / 100, yearsAfterPeak)
        return Math.max(declinedSalary, peakSalary * 0.4)
      }
    } else {
      // Bell curve mode
      if (age <= numPeakSalaryAge) {
        // Growth phase: linear growth from initial salary to max salary
        const growthYears = numPeakSalaryAge - numStartAge
        const currentGrowthYear = age - numStartAge
        const growthProgress = growthYears > 0 ? currentGrowthYear / growthYears : 1
        return numMonthlySalary + (numMaxSalary - numMonthlySalary) * growthProgress
      } else if (age <= numDeclineStartAge) {
        // Plateau phase: stay at max salary
        return numMaxSalary
      } else {
        // Decline phase: inverted bell curve decline
        const declineYears = numRetirementAge - numDeclineStartAge
        const currentDeclineYear = age - numDeclineStartAge
        const declineProgress = declineYears > 0 ? currentDeclineYear / declineYears : 0
        // Smooth decline using cosine curve
        const declineMultiplier = 0.5 * (1 + Math.cos(Math.PI * declineProgress))
        return numMaxSalary * (0.4 + 0.6 * declineMultiplier) // Decline to 40% of max
      }
    }
  }

  // Generate data based on user inputs
  const chartData = useMemo(() => {
    const data = []
    const years = numRetirementAge - numStartAge
    if (years <= 0) return []
    
    const annualGrowthRate = numGrowthRate / 100 // อัตราผลตอบแทนต่อปี
    
    // เริ่มต้นด้วยเงินต้น
    let totalPortfolio = numInitialInvestment
    
    for (let i = 0; i <= years; i++) {
      const age = numStartAge + i
      
      // คำนวณเงินเดือนของปีนั้นๆ
      const currentMonthlySalary = getMonthlySalaryAtAge(age, i)
      const activeIncome = Math.round(currentMonthlySalary * 12) // Annual income
      
      // คำนวณเงินที่ออมต่อปี = max(base × 12, % ของเงินเดือน × 12)
      const percentBasedSavings = currentMonthlySalary * (numInvestmentPercent / 100)
      const monthlyInvestment = Math.max(numBaseMonthlyInvestment, percentBasedSavings)
      const annualSavings = monthlyInvestment * 12
      
      // เงินพิเศษในปีนี้ (freelance, หวย, โบนัส)
      const extraIncome = extraIncomeByAge[age] || 0
      
      // Excel Formula: ทรัพย์สินสิ้นปี = ทรัพย์สินปีก่อน × (1 + ผลตอบแทน) + เงินเก็บต่อปี + เงินพิเศษ
      // Year 0: Initial + Savings + Extra
      // Year 1+: Previous × (1 + rate) + Savings + Extra
      if (i === 0) {
        // ปีแรก: เงินต้น × (1 + ผลตอบแทน) + เงินออม + เงินพิเศษ
        totalPortfolio = numInitialInvestment * (1 + annualGrowthRate) + annualSavings + extraIncome
      } else {
        // ปีถัดไป: พอร์ตปีก่อน × (1 + ผลตอบแทน) + เงินออม + เงินพิเศษ
        totalPortfolio = totalPortfolio * (1 + annualGrowthRate) + annualSavings + extraIncome
      }
      
      // Passive income = มูลค่าพอร์ต ณ สิ้นปี
      const passiveIncome = Math.round(totalPortfolio)
      
      // คำนวณเงินปันผลต่อเดือน = มูลค่าพอร์ต * (dividend yield / 100) / 12
      const monthlyDividend = Math.round(totalPortfolio * (numDividendYield / 100) / 12)
      
      data.push({
        year: `${age} ปี`,
        age,
        yearNum: i,
        activeIncome,
        passiveIncome,
        annualSavings: Math.round(annualSavings),
        monthlyInvestment: Math.round(monthlyInvestment),
        monthlySalary: Math.round(currentMonthlySalary),
        monthlyDividend,
        extraIncome,
      })
    }
    
    return data
  }, [numInitialInvestment, numInvestmentPercent, numBaseMonthlyInvestment, numGrowthRate, numDividendYield, numMonthlySalary, numSalaryGrowthRate, salaryGrowthMode, numMaxSalary, numPeakSalaryAge, numDeclineStartAge, numStartAge, numRetirementAge, extraIncomeByAge])

  // Find the crossover point: เงินปันผลต่อเดือน >= เงินเดือน
  const crossoverData = chartData.find(d => d.monthlyDividend >= d.monthlySalary)
  const crossoverAge = crossoverData?.age || numRetirementAge
  const finalPassive = chartData[chartData.length - 1]?.passiveIncome || 0
  const finalActive = chartData[chartData.length - 1]?.activeIncome || 0
  const finalMonthlyDividend = chartData[chartData.length - 1]?.monthlyDividend || 0
  const finalMonthlySalary = chartData[chartData.length - 1]?.monthlySalary || 0

  // Calculate milestones: เมื่อไหร่จะถึง 1M, 2M, 5M, 10M, 20M, 50M, 100M, 150M, 1000M
  const milestoneTargets = [1, 2, 5, 10, 20, 50, 100, 150, 1000] // in millions
  const milestones = useMemo(() => {
    const years = numRetirementAge - numStartAge
    if (years <= 0) return []
    
    return milestoneTargets.map(target => {
      const targetValue = target * 1000000
      const found = chartData.find(d => d.passiveIncome >= targetValue)
      
      // Calculate what's needed to reach this target if not reached
      let neededInitial: number | null = null
      let neededMonthly: number | null = null
      
      if (!found && years > 0) {
        // Calculate needed initial investment (keeping current monthly)
        // Using compound interest formula: FV = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
        const r = numGrowthRate / 100
        const n = years
        const currentMonthlyContribution = numBaseMonthlyInvestment * 12 // approximate annual contribution
        
        if (r > 0) {
          // FV = targetValue, solve for PV
          // targetValue = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
          // PV = (targetValue - PMT * ((1+r)^n - 1) / r) / (1+r)^n
          const futureValueOfAnnuity = currentMonthlyContribution * ((Math.pow(1 + r, n) - 1) / r)
          const neededPV = (targetValue - futureValueOfAnnuity) / Math.pow(1 + r, n)
          neededInitial = Math.max(0, Math.ceil(neededPV))
          
          // Calculate needed monthly investment (keeping current initial)
          // targetValue = numInitialInvestment * (1+r)^n + PMT * ((1+r)^n - 1) / r
          // PMT = (targetValue - numInitialInvestment * (1+r)^n) * r / ((1+r)^n - 1)
          const futureValueOfPrincipal = numInitialInvestment * Math.pow(1 + r, n)
          const neededAnnuity = (targetValue - futureValueOfPrincipal) * r / (Math.pow(1 + r, n) - 1)
          neededMonthly = Math.max(0, Math.ceil(neededAnnuity / 12))
        } else {
          // No growth, simple accumulation
          neededInitial = Math.max(0, targetValue - currentMonthlyContribution * n)
          neededMonthly = Math.max(0, Math.ceil((targetValue - numInitialInvestment) / (n * 12)))
        }
      }
      
      return {
        target,
        targetValue,
        age: found?.age || null,
        yearsToReach: found ? found.age - numStartAge : null,
        portfolioValue: found?.passiveIncome || null,
        neededInitial,
        neededMonthly,
      }
    })
  }, [chartData, numStartAge, numRetirementAge, numGrowthRate, numInitialInvestment, numBaseMonthlyInvestment])

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header with Toggle and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Easy Compounding
            </h1>
            <p className="text-muted-foreground text-lg">
              พลังของดอกเบี้ยทบต้น - The Power of Compound Interest
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <Button
              variant={showDetailedNumbers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDetailedNumbers(!showDetailedNumbers)}
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              {showDetailedNumbers ? "ตัวเลขละเอียด" : "ย่อ K/M/B"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPrint}
              className="flex items-center gap-2 print:hidden"
            >
              <Download className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Export Container */}
        <div ref={exportRef} className="space-y-6 bg-background">
        
        {/* Input Controls - Hidden when printing */}
        <Card className="border-2 border-primary/20 print:hidden" data-print-hide>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ตั้งค่าการคำนวณ
            </CardTitle>
            <CardDescription>
              ปรับค่าตามสถานการณ์ของคุณเพื่อดูผลลัพธ์
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Row 0: Personal Info */}
            <div className="space-y-3 mb-6 pb-6 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ข้อมูลส่วนตัว</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium">
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="ชื่อของคุณ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startAge" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    อายุเริ่มต้น (ปี)
                  </Label>
                  <Input
                    id="startAge"
                    type="number"
                    value={startAge}
                    onChange={(e) => setStartAge(parseInput(e.target.value))}
                    className="font-mono"
                    min={18}
                    max={60}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retireAge" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    อายุเกษียณ (ปี)
                  </Label>
                  <Input
                    id="retireAge"
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(parseInput(e.target.value))}
                    className="font-mono"
                    min={numStartAge + 1}
                    max={80}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* Row 1: Investment Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">การลงทุน</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* เงินต้นที่ลง */}
                <div className="space-y-2">
                  <Label htmlFor="initial" className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    เงินต้นที่ลง (บาท)
                  </Label>
                  <Input
                    id="initial"
                    type="number"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(parseInput(e.target.value))}
                    className="font-mono"
                    min={0}
                    step={10000}
                  />
                </div>

                {/* % ของเงินเดือนที่ลงทุน */}
                <div className="space-y-2">
                  <Label htmlFor="investPercent" className="flex items-center gap-2 text-sm font-medium">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    % ลงทุนจากเงินเดือน
                  </Label>
                  <Input
                    id="investPercent"
                    type="number"
                    value={investmentPercent}
                    onChange={(e) => setInvestmentPercent(parseInput(e.target.value))}
                    className="font-mono"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                {/* ขั้นต่ำที่ลงทุนต่อเดือน */}
                <div className="space-y-2">
                  <Label htmlFor="baseInvest" className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    ขั้นต่ำต่อเดือน (บาท)
                  </Label>
                  <Input
                    id="baseInvest"
                    type="number"
                    value={baseMonthlyInvestment}
                    onChange={(e) => setBaseMonthlyInvestment(parseInput(e.target.value))}
                    className="font-mono"
                    min={0}
                    step={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="growth" className="flex items-center gap-2 text-sm font-medium">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    % การเติบโตพอร์ต/ปี
                  </Label>
                  <Input
                    id="growth"
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(parseInput(e.target.value))}
                    className="font-mono"
                    min={0}
                    max={50}
                    step={0.5}
                  />
                </div>

                {/* % ปันผลต่อปี */}
                <div className="space-y-2">
                  <Label htmlFor="dividend" className="flex items-center gap-2 text-sm font-medium">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    % ปันผล/ปี
                  </Label>
                  <Input
                    id="dividend"
                    type="number"
                    value={dividendYield}
                    onChange={(e) => setDividendYield(parseInput(e.target.value))}
                    className="font-mono"
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Salary Settings */}
            <div className="space-y-3 mt-6 pt-6 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">รายได้เชิงรุก (เงินเดือน)</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">โหมด:</Label>
                  <Select value={salaryGrowthMode} onValueChange={(v) => setSalaryGrowthMode(v as "linear" | "bellcurve")}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">เพิ่มขึ้น % ต่อปี</SelectItem>
                      <SelectItem value="bellcurve">กราฟระฆังคว่ำ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Linear mode inputs */}
              {salaryGrowthMode === "linear" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="flex items-center gap-2 text-sm font-medium">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      เงินเดือนประจำ (บาท/เดือน)
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(parseInput(e.target.value))}
                      className="font-mono"
                      min={0}
                      step={1000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryGrowth" className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      อัตราเพิ่ม (% ต่อปี)
                    </Label>
                    <Input
                      id="salaryGrowth"
                      type="number"
                      value={salaryGrowthRate}
                      onChange={(e) => setSalaryGrowthRate(parseInput(e.target.value))}
                      className="font-mono"
                      min={0}
                      max={30}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peakAgeLinear" className="flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      อายุที่เงินเดือนสูงสุด
                    </Label>
                    <Input
                      id="peakAgeLinear"
                      type="number"
                      value={peakSalaryAge}
                      onChange={(e) => setPeakSalaryAge(parseInput(e.target.value))}
                      className="font-mono"
                      min={numStartAge}
                      max={numRetirementAge}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryDecline" className="flex items-center gap-2 text-sm font-medium">
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      อัตราลดลง (% ต่อปี)
                    </Label>
                    <Input
                      id="salaryDecline"
                      type="number"
                      value={salaryDeclineRate}
                      onChange={(e) => setSalaryDeclineRate(parseInput(e.target.value))}
                      className="font-mono"
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>
              )}

              {/* Bell curve mode inputs */}
              {salaryGrowthMode === "bellcurve" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="flex items-center gap-2 text-sm font-medium">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      เงินเดือนเริ่มต้น (บาท)
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(parseInput(e.target.value))}
                      className="font-mono"
                      min={0}
                      step={1000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSalary" className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      เงินเดือนสูงสุด (บาท)
                    </Label>
                    <Input
                      id="maxSalary"
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(parseInput(e.target.value))}
                      className="font-mono"
                      min={numMonthlySalary}
                      step={5000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peakAge" className="flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      อายุที่เงินเดือนสูงสุด
                    </Label>
                    <Input
                      id="peakAge"
                      type="number"
                      value={peakSalaryAge}
                      onChange={(e) => setPeakSalaryAge(parseInput(e.target.value))}
                      className="font-mono"
                      min={numStartAge}
                      max={numRetirementAge}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="declineAge" className="flex items-center gap-2 text-sm font-medium">
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      อายุที่เริ่มถดถอย
                    </Label>
                    <Input
                      id="declineAge"
                      type="number"
                      value={declineStartAge}
                      onChange={(e) => setDeclineStartAge(parseInput(e.target.value))}
                      className="font-mono"
                      min={numPeakSalaryAge}
                      max={numRetirementAge}
                      step={1}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Summary Info - Excel style */}
            {chartData.length > 0 && (
              <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg">
                <p className="text-center text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                  ยินดีด้วยครับคุณ {userName || "นักลงทุน"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-green-700 dark:text-green-300">
                  {milestones.find(m => m.target === 1)?.age && (
                    <p className="text-center">คุณจะมีเงินล้านแรกตอนอายุ <strong>{milestones.find(m => m.target === 1)?.age}</strong> ปี</p>
                  )}
                  {milestones.find(m => m.target === 10)?.age && (
                    <p className="text-center">คุณจะมีเงิน 10 ล้านตอนอายุ <strong>{milestones.find(m => m.target === 10)?.age}</strong> ปี</p>
                  )}
                  <p className="text-center sm:col-span-2">
                    เมื่อคุณเกษียณตอน {numRetirementAge} ปี คุณจะมีเงินเก็บ <strong>{formatNumber(finalPassive)}</strong> บาท
                  </p>
                  {!milestones.find(m => m.target === 100)?.age && (
                    <p className="text-center sm:col-span-2 text-amber-700 dark:text-amber-300">
                      และถ้าคุณอยากมีเงิน 100 ล้านบาท คุณต้องลงทุนต่อไปถึงอายุ {
                        (() => {
                          // Calculate when 100M is reached
                          let portfolio = finalPassive
                          let age = numRetirementAge
                          const rate = numGrowthRate / 100
                          while (portfolio < 100000000 && age < 100) {
                            portfolio = portfolio * (1 + rate)
                            age++
                          }
                          return age
                        })()
                      } ปี
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Row 4: Lump Sum / Extra Income */}
            <div className="space-y-3 mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Gift className="h-4 w-4" />
                เงินก้อนพิเศษ (Lump Sum)
              </h3>
              <p className="text-xs text-muted-foreground">
                เพิ่มเงินก้อนพิเศษในปีที่ต้องการ เช่น โบนัส, Freelance, หวย, มรดก - เงินจะถูกนำไปทบต้นด้วย
              </p>
              
              {/* Add new lump sum */}
              <div className="flex flex-wrap gap-3 items-end p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">อายุ (ปี)</Label>
                  <Select
                    value={newLumpSumAge === "" ? "" : String(newLumpSumAge)}
                    onValueChange={(val) => setNewLumpSumAge(val ? Number(val) : "")}
                  >
                    <SelectTrigger className="w-24 font-mono">
                      <SelectValue placeholder="เลือก" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: numRetirementAge - numStartAge + 1 }, (_, i) => numStartAge + i).map(age => (
                        <SelectItem key={age} value={String(age)}>{age} ปี</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">จำนวนเงิน (บาท)</Label>
                  <Input
                    type="number"
                    value={newLumpSumAmount}
                    onChange={(e) => setNewLumpSumAmount(parseInput(e.target.value))}
                    placeholder="100,000"
                    className="w-32 font-mono"
                    min={0}
                    step={10000}
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <Label className="text-xs">หมายเหตุ</Label>
                  <Input
                    type="text"
                    value={newLumpSumNote}
                    onChange={(e) => setNewLumpSumNote(e.target.value)}
                    placeholder="โบนัส, Freelance, หวย..."
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={addLumpSum}
                  disabled={newLumpSumAge === "" || newLumpSumAmount === "" || Number(newLumpSumAmount) <= 0}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่ม
                </Button>
              </div>
              
              {/* Lump sum list */}
              {lumpSumList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">รายการเงินก้อนพิเศษ ({lumpSumList.length} รายการ)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lumpSumList
                      .sort((a, b) => a.age - b.age)
                      .map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                              อายุ {item.age} ปี: {formatNumber(item.amount)} บาท
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{item.note}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLumpSum(item.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    รวมทั้งหมด: {formatNumber(lumpSumList.reduce((sum, item) => sum + item.amount, 0))} บาท
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Chart Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Interest Profit Display
            </CardTitle>
            <CardDescription>
              เปรียบเทียบรายได้เชิงรุก (Active) vs รายได้จากปันผล (Passive Dividend) ตั้งแต่อายุ {numStartAge} ถึง {numRetirementAge} ปี
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full print:w-[75%]">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  interval={Math.max(1, Math.floor(chartData.length / 8))}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`
                    }
                    return `${value}`
                  }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const data = payload[0]?.payload
                    if (!data) return null
                    
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[280px]">
                        <p className="font-semibold text-foreground border-b pb-2 mb-2">{label}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span className="text-sm text-muted-foreground">รายได้เชิงรุก/ปี</span>
                            </div>
                            <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                              {formatNumber(data.activeIncome)} บาท
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-400" />
                              <span className="text-sm text-muted-foreground">เงินเดือน/เดือน</span>
                            </div>
                            <span className="font-mono text-red-500">
                              {formatNumber(data.monthlySalary)} บาท
                            </span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm text-muted-foreground">มูลค่าพอร์ต</span>
                              </div>
                              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                {formatNumber(data.passiveIncome)} บาท
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-400" />
                              <span className="text-sm text-muted-foreground">ปันผล/เดือน</span>
                            </div>
                            <span className="font-mono text-green-500">
                              {formatNumber(data.monthlyDividend)} บาท
                            </span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-sm text-muted-foreground">ลงทุน/เดือน</span>
                              </div>
                              <span className="font-mono text-blue-600 dark:text-blue-400">
                                {formatNumber(data.monthlyInvestment)} บาท
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                
                {/* Reference line at crossover point */}
                {crossoverData && (
                  <ReferenceLine 
                    x={`${crossoverAge} ปี`} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: "Crossover", fill: 'hsl(var(--primary))', fontSize: 12 }}
                  />
                )}
                
                {/* Active Income - Inverted Bell Curve (upside down) */}
                <Line
                  type="natural"
                  dataKey="activeIncome"
                  stroke="var(--color-activeIncome)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                
                {/* Passive Income (ปันผล) - Exponential Growth */}
                <Line
                  type="monotone"
                  dataKey="passiveIncome"
                  stroke="var(--color-passiveIncome)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                เงินเดือน/เดือน
              </CardTitle>
              <CardDescription className="text-xs">
                รายได้ต่อปี {formatNumber(finalActive)} บาท
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(finalMonthlySalary)} บาท
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ณ อายุ {numRetirementAge} ปี (Inverted Bell)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                เงินปันผล/เดือน
              </CardTitle>
              <CardDescription className="text-xs">
                จากพอร์ต {formatNumber(finalPassive)} บาท
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(finalMonthlyDividend)} บาท
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ณ อายุ {numRetirementAge} ปี (ปันผล {numDividendYield}%/ปี)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                จุดตัดกัน (Crossover)
              </CardTitle>
              <CardDescription className="text-xs">
                ปันผล/เดือน &gt;= เงินเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {crossoverData ? `อายุ ${crossoverAge} ปี` : "ยังไม่ถึง"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {crossoverData 
                  ? `ใช้เวลา ${crossoverAge - numStartAge} ปี` 
                  : `ปันผล ${formatNumber(finalMonthlyDividend)} vs เงินเดือน ${formatNumber(finalMonthlySalary)}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Dividend vs Salary Chart */}
        <Card className="border-2 border-purple-200 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
              เงินปันผล/เดือน vs เงินเดือน
            </CardTitle>
            <CardDescription>
              เปรียบเทียบรายได้ต่อเดือน - หาจุดที่ปันผลแซงเงินเดือน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyChartConfig} className="h-[350px] w-full print:w-[75%]">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  interval={Math.max(1, Math.floor(chartData.length / 8))}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`
                    }
                    return `${value}`
                  }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const data = payload[0]?.payload
                    if (!data) return null
                    
                    const isDividendHigher = data.monthlyDividend >= data.monthlySalary
                    const difference = data.monthlyDividend - data.monthlySalary
                    
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[300px]">
                        <p className="font-semibold text-foreground border-b pb-2 mb-2">{label}</p>
                        <div className="space-y-3">
                          <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/30">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">เงินเดือน/เดือน</span>
                              </div>
                              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                {formatNumber(data.monthlySalary)} บาท
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">ปันผล/เดือน</span>
                              </div>
                              <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                {formatNumber(data.monthlyDividend)} บาท
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-5">
                              จากพอร์ต {formatNumber(data.passiveIncome)} บาท
                            </p>
                          </div>
                          
                          <div className={`p-2 rounded-md border-2 ${isDividendHigher ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-muted bg-muted/30'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">ส่วนต่าง</span>
                              <span className={`font-mono font-bold ${isDividendHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isDividendHigher ? '+' : ''}{formatNumber(difference)} บาท
                              </span>
                            </div>
                            {isDividendHigher && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ปันผลมากกว่าเงินเดือนแล้ว!
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                
                {/* Reference line at crossover point */}
                {crossoverData && (
                  <ReferenceLine 
                    x={`${crossoverAge} ปี`} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: `Crossover ${crossoverAge} ปี`, fill: 'hsl(var(--primary))', fontSize: 11 }}
                  />
                )}
                
                {/* เงินเดือน/เดือน - Inverted Bell Curve */}
                <Line
                  type="natural"
                  dataKey="monthlySalary"
                  stroke="var(--color-monthlySalary)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                
                {/* ปันผล/เดือน - Exponential Growth */}
                <Line
                  type="monotone"
                  dataKey="monthlyDividend"
                  stroke="var(--color-monthlyDividend)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Milestones Card */}
        <Card className="border-2 border-amber-200 dark:border-amber-900" data-print-section>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Target className="h-5 w-5" />
              Milestones - เมื่อไหร่จะถึงล้านแรก?
            </CardTitle>
            <CardDescription>
              เป้าหมายมูลค่าพอร์ตที่ต้องการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {milestones.map((milestone) => (
                  <div 
                    key={milestone.target}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      milestone.age 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800' 
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-xl font-bold text-foreground">
                        {milestone.target >= 1000 
                          ? `${(milestone.target / 1000).toFixed(0)}B` 
                          : `${milestone.target}M`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({(milestone.targetValue / 1000000).toLocaleString()} ล้านบาท)
                      </p>
                    </div>
                    
                    {milestone.age ? (
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          อายุ {milestone.age} ปี
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ใช้เวลา {milestone.yearsToReach} ปี
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 text-center">
                          ยังไม่ถึงภายในเกษียณ
                        </p>
                        <div className="border-t border-amber-200 dark:border-amber-800 pt-2 space-y-1">
                          <p className="text-xs text-muted-foreground text-center font-medium">
                            ต้องทำอย่างใดอย่างหนึ่ง:
                          </p>
                          {milestone.neededInitial !== null && milestone.neededInitial > 0 && (
                            <div className="flex items-center justify-between text-xs bg-background/50 rounded p-1.5">
                              <span className="text-muted-foreground">เงินต้น:</span>
                              <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                                {formatNumber(milestone.neededInitial)} บาท
                              </span>
                            </div>
                          )}
                          {milestone.neededMonthly !== null && milestone.neededMonthly > 0 && (
                            <div className="flex items-center justify-between text-xs bg-background/50 rounded p-1.5">
                              <span className="text-muted-foreground">ลงทุน/เดือน:</span>
                              <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                                {formatNumber(milestone.neededMonthly)} บาท
                              </span>
                            </div>
                          )}
                          {(milestone.neededInitial === null || milestone.neededInitial <= 0) && 
                           (milestone.neededMonthly === null || milestone.neededMonthly <= 0) && (
                            <p className="text-xs text-center text-muted-foreground italic">
                              ต้องเพิ่ม % การเติบโตหรือเวลาลงทุน
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                * คำนวณจากมูลค่าพอร์ตทั้งหมด (เงินต้น + เงินลงทุนสะสม + กำไรทบต้น) 
                ภายในช่วงอายุ {numStartAge} - {numRetirementAge} ปี
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="border-2" data-print-section>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              ตารางรายละเอียดแต่ละปี
            </CardTitle>
            <CardDescription>
              แสดงรายละเอียดเงินที่จะได้ในแต่ละปี พร้อม Note สถานะ (เพิ่มเงินพิเศษได้ที่ตั้งค่าด้านบน)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-16">อายุ</TableHead>
                    <TableHead className="text-right">เงินเดือน</TableHead>
                    <TableHead className="text-right">เงินเก็บต่อปี</TableHead>
                    <TableHead className="text-center min-w-[120px]">เงินพิเศษ</TableHead>
                    <TableHead className="text-right">ทรัพย์สินสิ้นปี</TableHead>
                    <TableHead className="text-right">ปันผล/เดือน</TableHead>
                    <TableHead className="text-left min-w-[180px]">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((row, index) => {
                    // Generate notes
                    const notes: string[] = []
                    
                    // Check milestones
                    const prevPortfolio = index > 0 ? chartData[index - 1].passiveIncome : 0
                    milestoneTargets.forEach(target => {
                      const targetValue = target * 1000000
                      if (row.passiveIncome >= targetValue && prevPortfolio < targetValue) {
                        notes.push(`ถึง ${target >= 1000 ? `${target/1000}B` : `${target}M`} แรก!`)
                      }
                    })
                    
                    // Check crossover
                    if (crossoverData && row.age === crossoverAge) {
                      notes.push("Crossover! ปันผล >= เงินเดือน")
                    }
                    
                    // Check salary phases
                    if (row.age === numPeakSalaryAge && numPeakSalaryAge < numRetirementAge) {
                      notes.push("เงินเดือนสูงสุด")
                    }
                    if (salaryGrowthMode === "bellcurve" && row.age === numDeclineStartAge) {
                      notes.push("เริ่มถดถอย")
                    }
                    if (row.age === numStartAge) {
                      notes.push("เริ่มต้น")
                    }
                    if (row.age === numRetirementAge) {
                      notes.push("เกษียณ")
                    }
                    if (row.extraIncome > 0) {
                      notes.push(`+${formatNumber(row.extraIncome, true)} พิเศษ`)
                    }
                    
                    const isCrossover = crossoverData && row.age === crossoverAge
                    const isMilestone = notes.some(n => n.includes("ถึง"))
                    const hasExtraIncome = row.extraIncome > 0
                    
                    return (
                      <TableRow 
                        key={row.age}
                        className={
                          isCrossover 
                            ? "bg-blue-50 dark:bg-blue-950/30" 
                            : isMilestone 
                              ? "bg-amber-50 dark:bg-amber-950/30"
                              : hasExtraIncome
                                ? "bg-purple-50 dark:bg-purple-950/30"
                                : ""
                        }
                      >
                        <TableCell className="text-center font-medium">{row.age}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(row.monthlySalary)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                          {formatNumber(row.annualSavings)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {row.extraIncome > 0 ? (
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              +{formatNumber(row.extraIncome)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-green-600 dark:text-green-400">
                          {formatNumber(row.passiveIncome)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          <span className={row.monthlyDividend >= row.monthlySalary ? "text-green-600 dark:text-green-400 font-semibold" : ""}>
                            {formatNumber(row.monthlyDividend)}
                          </span>
                        </TableCell>
                        <TableCell className="text-left">
                          {notes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {notes.map((note, i) => (
                                <span 
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    note.includes("Crossover") 
                                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                      : note.includes("ถึง")
                                        ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                                        : note.includes("พิเศษ")
                                          ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                          : note.includes("สูงสุด")
                                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                            : note.includes("ถดถอย")
                                              ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                              : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
              <p><strong>สูตรคำนวณ (ตาม Excel):</strong></p>
              <p>- <strong>เงินเก็บต่อปี:</strong> เงินเดือน × 12 × {numInvestmentPercent}% {numBaseMonthlyInvestment > 0 && `(ขั้นต่ำ ${numBaseMonthlyInvestment.toLocaleString()} บาท/เดือน)`}</p>
              <p>- <strong>ทรัพย์สินสิ้นปี:</strong> ทรัพย์สินปีก่อน × (1 + {numGrowthRate}%) + เงินเก็บต่อปี + เงินพิเศษ</p>
              <p>- <strong>ปันผล/เดือน:</strong> ทรัพย์สินสิ้นปี × {numDividendYield}% ÷ 12</p>
              {salaryGrowthMode === "linear" && (
                <p>- <strong>เงินเดือน:</strong> เพิ่มขึ้น {numSalaryGrowthRate}% ต่อปี จนถึงอายุ {numPeakSalaryAge} ปี แล้วลดลง {numSalaryDeclineRate}% ต่อปี</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Explanation Card */}
        <Card>
          <CardHeader>
            <CardTitle>แนวคิด Easy Compounding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">เงินเดือน (Active Income)</p>
                <p className="text-sm">
                  {salaryGrowthMode === "linear" 
                    ? `เริ่มต้น ${formatNumber(numMonthlySalary)} บาท เพิ่มขึ้น ${numSalaryGrowthRate}%/ปี ถึงอายุ ${numPeakSalaryAge} แล้วลดลง ${numSalaryDeclineRate}%/ปี`
                    : "เติบโตแบบ Bell Curve - ขึ้นสูงสุดแล้วค่อยๆ ลดลงก่อนเกษียณ"
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">ทรัพย์สินสิ้นปี (Portfolio)</p>
                <p className="text-sm">
                  สูตร: ทรัพย์สินปีก่อน × (1 + {numGrowthRate}%) + เงินเก็บต่อปี + เงินพิเศษ
                </p>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg mt-4">
              <p className="text-sm text-foreground font-medium">
                เป้าหมาย: ให้เงินปันผลต่อเดือน &gt;= เงินเดือน ให้เร็วที่สุด!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crossover = จุดที่ปันผลรายเดือน (พอร์ต × {numDividendYield}% ÷ 12) แซงเงินเดือน
              </p>
            </div>
          </CardContent>
        </Card>
        
        </div>{/* End of exportRef */}
      </div>
    </main>
  )
}
