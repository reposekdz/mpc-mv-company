import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useAuthStore } from "@/store/useAuthStore";
import type { Employee, PaymentStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
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
  User,
  Building2,
} from "lucide-react";

export function EmployeesPage() {
  const { t } = useTranslation();
  const { employees, fetchEmployees, addEmployee, updateEmployee, deleteEmployee, processPayroll, loading } = useAppStore();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);

  // Load employees with filters
  const loadEmployees = useCallback(async () => {
    const params = new URLSearchParams();
    if (deptFilter !== "all") params.append("department", deptFilter);
    if (statusFilter !== "all") params.append("payment_status", statusFilter);
    if (search) params.append("search", search);
    await fetchEmployees(params.toString());
  }, [fetchEmployees, deptFilter, statusFilter, search]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = [...new Set(employees.map((e) => e.department))];

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = 
      e.first_name.toLowerCase().includes(search.toLowerCase()) ||
      e.last_name.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || e.department === deptFilter;
    const matchesStatus = statusFilter === "all" || e.payment_status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const payrollPending = employees.filter((e) => e.payment_status === "pending").length;

  if (loading.employees) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-32 animate-pulse">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-[400px] bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newEmployee = {
      first_name: fd.get("firstName") as string,
      last_name: fd.get("lastName") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      position: fd.get("position") as string,
      department: fd.get("department") as string,
      salary: Number(fd.get("salary")),
      hourly_rate: Number(fd.get("hourlyRate")),
      hire_date: fd.get("hireDate") as string,
      employment_type: fd.get("employmentType") as string,
    };
    try {
      await addEmployee(newEmployee);
      setAddOpen(false);
      loadEmployees();
    } catch (error) {
      console.error("Add employee failed", error);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editEmp) return;
    const fd = new FormData(e.currentTarget);
    const updates = {
      first_name: fd.get("firstName") as string,
      last_name: fd.get("lastName") as string,
      position: fd.get("position") as string,
      department: fd.get("department") as string,
      salary: Number(fd.get("salary")),
      hourly_rate: Number(fd.get("hourlyRate")),
      status: fd.get("status") as string,
    };
    try {
      await updateEmployee(editEmp.id, updates);
      setEditEmp(null);
      loadEmployees();
    } catch (error) {
      console.error("Update employee failed", error);
    }
  };

  const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
    paid: { label: t("salaries.paid") || "Paid", color: "bg-green-100 text-green-800" },
    pending: { label: t("salaries.pending") || "Pending", color: "bg-amber-100 text-amber-800" },
    overdue: { label: t("salaries.overdue") || "Overdue", color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-steel/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-steel" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("employees.total")}</p>
                  <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-hunter/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-hunter" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("employees.active")}</p>
                  <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("employees.pendingPayroll")}</p>
                  <p className="text-2xl font-bold text-foreground">{payrollPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-steel/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-steel" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("employees.monthlyPayroll")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(employees.reduce((sum, e) => sum + e.salary, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t("employees.searchEmployees") || "Search employees..."} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9" 
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("employees.department") || "Department"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("employees.allDepartments") || "All Departments"}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | "all")}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("employees.status") || "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={processPayroll}
            disabled={loading.employees}
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            {t("employees.processPayroll") || "Process Payroll"}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-steel hover:bg-steel-dark gap-2">
                <Plus className="w-4 h-4" />
                {t("employees.addEmployee") || "Add Employee"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("employees.addEmployee") || "Add New Employee"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input name="firstName" required />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input name="lastName" required />
                  </div>
                  <div className="col-span-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Input name="position" required />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input name="department" required />
                  </div>
                  <div>
                    <Label>Salary (RWF)</Label>
                    <Input name="salary" type="number" required />
                  </div>
                  <div>
                    <Label>Hourly Rate (RWF)</Label>
                    <Input name="hourlyRate" type="number" required />
                  </div>
                  <div>
                    <Label>Hire Date</Label>
                    <Input name="hireDate" type="date" required />
                  </div>
                  <div>
                    <Label>Employment Type</Label>
                    <Select name="employmentType" defaultValue="full_time">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading.employees}>
                  Add Employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("employees.employeesList") || "Employees List"}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    <div>
                      {emp.first_name} {emp.last_name}
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{emp.department}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(emp.salary)}
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusConfig[emp.payment_status as PaymentStatus]?.color}>
                      {paymentStatusConfig[emp.payment_status as PaymentStatus]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{emp.hire_date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditEmp(emp)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Paid
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editEmp} onOpenChange={(o) => !o && setEditEmp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editEmp && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input name="firstName" defaultValue={editEmp.first_name} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input name="lastName" defaultValue={editEmp.last_name} />
                </div>
                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input name="email" defaultValue={editEmp.email} />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input name="position" defaultValue={editEmp.position} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input name="department" defaultValue={editEmp.department} />
                </div>
                <div>
                  <Label>Salary (RWF)</Label>
                  <Input name="salary" type="number" defaultValue={editEmp.salary} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editEmp.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Update Employee
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

