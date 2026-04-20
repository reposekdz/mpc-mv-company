import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import type { Employee, PaymentStatus } from "@/types";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
} from "lucide-react";

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid: { label: "Paid", color: "bg-hunter/10 text-hunter", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber/10 text-amber", icon: Clock },
  overdue: { label: "Overdue", color: "bg-iron/10 text-iron", icon: AlertTriangle },
};

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function SalariesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useAppStore();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  const departments = [...new Set(employees.map((e) => e.department))];

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const totalPayroll = employees.reduce((s, e) => s + e.netPay, 0);
  const paidCount = employees.filter((e) => e.paymentStatus === "paid").length;
  const pendingCount = employees.filter((e) => e.paymentStatus === "pending").length;
  const overdueCount = employees.filter((e) => e.paymentStatus === "overdue").length;

  const kpis = [
    { title: "Total Payroll", value: `$${totalPayroll.toLocaleString()}`, icon: DollarSign, color: "text-steel", bg: "bg-steel/10" },
    { title: "Employees", value: employees.length.toString(), icon: Users, color: "text-hunter", bg: "bg-hunter/10" },
    { title: "Paid", value: paidCount.toString(), icon: CheckCircle, color: "text-hunter", bg: "bg-hunter/10" },
    { title: "Pending / Overdue", value: `${pendingCount} / ${overdueCount}`, icon: AlertTriangle, color: "text-amber", bg: "bg-amber/10" },
  ];

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const baseSalary = Number(fd.get("baseSalary"));
    const deductions = Number(fd.get("deductions"));
    const bonuses = Number(fd.get("bonuses"));
    const newEmp: Employee = {
      id: `e${Date.now()}`,
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      department: fd.get("department") as string,
      baseSalary,
      deductions,
      bonuses,
      netPay: baseSalary - deductions + bonuses,
      paymentStatus: "pending",
      paymentDate: fd.get("paymentDate") as string,
      payPeriod: fd.get("payPeriod") as "monthly" | "weekly",
    };
    addEmployee(newEmp);
    setAddOpen(false);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editEmp) return;
    const fd = new FormData(e.currentTarget);
    const baseSalary = Number(fd.get("baseSalary"));
    const deductions = Number(fd.get("deductions"));
    const bonuses = Number(fd.get("bonuses"));
    updateEmployee(editEmp.id, {
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      department: fd.get("department") as string,
      baseSalary,
      deductions,
      bonuses,
      netPay: baseSalary - deductions + bonuses,
      paymentStatus: fd.get("paymentStatus") as PaymentStatus,
      paymentDate: fd.get("paymentDate") as string,
      payPeriod: fd.get("payPeriod") as "monthly" | "weekly",
    });
    setEditEmp(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{kpi.title}</div>
                    <div className="heading-md text-foreground">{kpi.value}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-steel hover:bg-steel-dark gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="heading-md">Add Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Employee Name</Label>
                  <Input name="name" required />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input name="role" required />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input name="department" required />
                </div>
                <div>
                  <Label>Base Salary ($)</Label>
                  <Input name="baseSalary" type="number" required />
                </div>
                <div>
                  <Label>Deductions ($)</Label>
                  <Input name="deductions" type="number" defaultValue={0} />
                </div>
                <div>
                  <Label>Bonuses ($)</Label>
                  <Input name="bonuses" type="number" defaultValue={0} />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input name="paymentDate" type="date" required />
                </div>
                <div>
                  <Label>Pay Period</Label>
                  <Select name="payPeriod" defaultValue="monthly">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">Add Employee</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => {
                  const statusCfg = paymentStatusConfig[emp.paymentStatus];
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{emp.department}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">${emp.baseSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-iron">-${emp.deductions.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-hunter">+${emp.bonuses.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">${emp.netPay.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditEmp(emp)}>
                              <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateEmployee(emp.id, { paymentStatus: "paid" })}>
                              <CheckCircle className="w-3.5 h-3.5 mr-2" /> Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateEmployee(emp.id, { paymentStatus: "pending" })}>
                              <Clock className="w-3.5 h-3.5 mr-2" /> Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteEmployee(emp.id)} className="text-destructive">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editEmp} onOpenChange={(o) => !o && setEditEmp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="heading-md">Edit Employee</DialogTitle>
          </DialogHeader>
          {editEmp && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Employee Name</Label>
                  <Input name="name" defaultValue={editEmp.name} required />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input name="role" defaultValue={editEmp.role} required />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input name="department" defaultValue={editEmp.department} required />
                </div>
                <div>
                  <Label>Base Salary ($)</Label>
                  <Input name="baseSalary" type="number" defaultValue={editEmp.baseSalary} required />
                </div>
                <div>
                  <Label>Deductions ($)</Label>
                  <Input name="deductions" type="number" defaultValue={editEmp.deductions} />
                </div>
                <div>
                  <Label>Bonuses ($)</Label>
                  <Input name="bonuses" type="number" defaultValue={editEmp.bonuses} />
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select name="paymentStatus" defaultValue={editEmp.paymentStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input name="paymentDate" type="date" defaultValue={editEmp.paymentDate} required />
                </div>
                <div>
                  <Label>Pay Period</Label>
                  <Select name="payPeriod" defaultValue={editEmp.payPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-steel hover:bg-steel-dark">Update Employee</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
