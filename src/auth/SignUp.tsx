import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CiUnread, CiRead } from "react-icons/ci";
import { userRepo } from "../repositories/userRepo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import authBg from "@/assets/auth-bg.png";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bq_id: z.string().min(1, "BQ ID is required"),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  CNIC: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must be in format XXXXX-XXXXXXX-X"),
  password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be less than 64 characters"),
  course: z.string().min(1, "Course is required"),
  gender: z.string().min(1, "Gender is required"),
  shift: z.string().min(1, "Shift is required"),
  location: z.string().min(1, "Location is required"),
  dob: z.string().refine((val) => {
    const dobDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age > 12;
  }, "You must be greater than 12 years old"),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError, // Added setError
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      bq_id: "",
      email: "",
      phone: "",
      CNIC: "",
      password: "",
      course: "",
      gender: "",
      shift: "",
      location: "",
      dob: "", // Added default value
      termsAccepted: false,
    },
  });

  const cnicValue = watch("CNIC");
  const phoneValue = watch("phone");

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const res = await userRepo.getEnums();
        setCourses(res.courses || []);
        setGenders(res.genders || []);
        setShifts(res.shifts || []);
        setLocations(res.locations || []);
      } catch (err) {
        toast.error("Failed to load options");
      }
    };
    fetchEnums();
  }, []);

  // Phone masking/cleaning helper
  useEffect(() => {
    if (phoneValue) {
      let cleaned = phoneValue.replace(/\D/g, "");
      // Remove leading 0 if present (e.g. 0300 -> 300)
      if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
      }
      cleaned = cleaned.slice(0, 10);

      if (cleaned !== phoneValue) {
        setValue("phone", cleaned);
      }
    }
  }, [phoneValue, setValue]);

  // CNIC formatting helper
  const formatCNIC = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  };

  useEffect(() => {
    if (cnicValue) {
      const formatted = formatCNIC(cnicValue);
      if (formatted !== cnicValue && formatted.length <= 15) { // 13 digits + 2 dashes = 15 chars
        setValue("CNIC", formatted);
      }
    }
  }, [cnicValue, setValue]);


  const onSubmit = async (data: SignUpFormValues) => {
    try {
      const dataToSend = {
        ...data,
        phone: data.phone ? `92${data.phone}` : "",
        // CNIC is already in correct format due to auto-formatting
      };

      await userRepo.addUser(dataToSend);
      toast.success("User registered successfully");
      navigate("/login");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          // @ts-ignore
          setError(key as keyof SignUpFormValues, { type: "server", message: backendErrors[key] });
        });
        toast.error("Registration failed. Please check the errors above.");
      } else {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:block h-full relative overflow-hidden">
        <img
          src={authBg}
          alt="Authentication Background"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-black/20 to-black/10" />
        <div className="absolute bottom-16 left-16 text-white z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-16 h-1 w-primary bg-white mb-6 rounded-full" />
          <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">Join Elite Community</h1>
          <p className="text-xl opacity-80 font-medium tracking-tight">Start your high-performance incubation journey with us today.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="h-full overflow-y-auto bg-white p-8 lg:p-16">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 py-10">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground font-medium tracking-tight">
                Join our premium community and excel together
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className={cn(
                      "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                      errors.name ? "border-red-500" : ""
                    )}
                    {...register("name")}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bq_id" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">BQ ID</Label>
                  <Input
                    id="bq_id"
                    placeholder="12345"
                    className={cn(
                      "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                      errors.bq_id ? "border-red-500" : ""
                    )}
                    {...register("bq_id")}
                  />
                  {errors.bq_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.bq_id.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={cn(
                    "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                    errors.email ? "border-red-500" : ""
                  )}
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-muted-foreground/60 transition-colors">+92</span>
                    <Input
                      id="phone"
                      className={cn(
                        "h-12 rounded-xl border-muted/50 bg-muted/5 pl-12 focus-visible:ring-primary/20",
                        errors.phone ? "border-red-500" : ""
                      )}
                      placeholder="3001234567"
                      maxLength={10}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="CNIC" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CNIC Number</Label>
                  <Input
                    id="CNIC"
                    placeholder="12345-1234567-1"
                    maxLength={15}
                    className={cn(
                      "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                      errors.CNIC ? "border-red-500" : ""
                    )}
                    {...register("CNIC")}
                  />
                  {errors.CNIC && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.CNIC.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" university-id="password_signup" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Create Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 pr-12 focus-visible:ring-primary/20",
                      errors.password ? "border-red-500" : ""
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 cursor-pointer hover:text-primary transition-colors select-none"
                  >
                    {showPassword ? <CiUnread size={22} /> : <CiRead size={22} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  className={cn(
                    "h-12 rounded-xl border-muted/50 bg-muted/5 px-4 focus-visible:ring-primary/20",
                    errors.dob ? "border-red-500" : ""
                  )}
                  {...register("dob")}
                />
                {errors.dob && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.dob.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={cn(
                        "h-12 rounded-xl border-muted/50 bg-muted/5 focus:ring-primary/20",
                        errors.location ? "border-red-500" : ""
                      )}>
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted/20">
                        {locations.map((l) => (
                          <SelectItem key={l} value={l} className="rounded-lg">
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.location && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.location.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Course</Label>
                  <Controller
                    name="course"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={cn(
                          "h-12 rounded-xl border-muted/50 bg-muted/5 focus:ring-primary/20",
                          errors.course ? "border-red-500" : ""
                        )}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-muted/20">
                          {courses.map((c) => (
                            <SelectItem key={c} value={c} className="rounded-lg">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.course && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.course.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                        className="justify-start gap-2 h-12"
                      >
                        {genders.map((g) => (
                          <ToggleGroupItem
                            key={g}
                            value={g}
                            className="flex-1 rounded-xl border border-muted/30 h-full text-[10px] font-black uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-all"
                          >
                            {g}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  />
                  {errors.gender && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Shift</Label>
                  <Controller
                    name="shift"
                    control={control}
                    render={({ field }) => (
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                        className="justify-start gap-2 h-12"
                      >
                        {shifts.map((s) => (
                          <ToggleGroupItem
                            key={s}
                            value={s}
                            className="flex-1 rounded-xl border border-muted/30 h-full text-[10px] font-black uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-all"
                          >
                            {s}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  />
                  {errors.shift && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.shift.message}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Controller
                  name="termsAccepted"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      className="rounded-md h-5 w-5 border-muted/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer border-primary"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-snug cursor-pointer select-none">
                  I accept the {" "}
                  <Dialog>
                    <DialogTrigger asChild>
                      <span className="text-primary hover:opacity-70 transition-opacity cursor-pointer underline">terms and conditions & privacy policy</span>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[2rem] border-muted/20">
                      <DialogHeader className="space-y-4">
                        <DialogTitle className="text-2xl font-black tracking-tight">Policies & Guidelines</DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                          Please review our elite community standards carefully.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 text-sm py-4">
                        <section className="space-y-3">
                          <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">Incubation Rules</h3>
                          <ul className="list-disc list-inside space-y-2 text-muted-foreground font-medium text-[13px]">
                            <li><strong>Attendance:</strong> 80% mandatory presence for elite status.</li>
                            <li><strong>Conduct:</strong> Professionalism is our core value.</li>
                            <li><strong>Submission:</strong> High-performance deadline adherence.</li>
                            <li><strong>Intellectual Property:</strong> Respect creators, no plagiarism.</li>
                          </ul>
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">Privacy Framework</h3>
                          <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">Your data is secured within our premium encrypted infrastructure. We only use information for program management.</p>
                        </section>
                      </div>
                    </DialogContent>
                  </Dialog>
                </Label>
              </div>
              {errors.termsAccepted && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.termsAccepted.message}</p>}

              <Button className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 mt-4" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Create Account"}
              </Button>
            </form>

            <div className="pt-2 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:opacity-80 transition-opacity ml-1">
                Account Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;