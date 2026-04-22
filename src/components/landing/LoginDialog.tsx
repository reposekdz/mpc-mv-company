import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/useAuthStore";
import { LogIn, Shield, AlertCircle } from "lucide-react";

export function LoginDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const { login, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, passcode);
    if (result.success) {
      setOpen(false);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEmail("");
      setPasscode("");
      clearError();
    }
  };

  return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="bg-steel hover:bg-steel-dark text-white font-semibold px-8 py-6 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
          >
            <LogIn className="w-5 h-5" />
            {t("login.managerLogin")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-steel" />
            </div>
            <div>
              <DialogTitle className="heading-md text-foreground">{t("login.managerAccess")}</DialogTitle>
              <DialogDescription>{t("login.signInDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("login.invalidCredentials")}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.emailAddress")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">{t("login.passcode")}</Label>
            <Input
              id="passcode"
              type="password"
              placeholder={t("login.passcodePlaceholder")}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-steel hover:bg-steel-dark text-white font-semibold"
          >
            {t("login.signIn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
