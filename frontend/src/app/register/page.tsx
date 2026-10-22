'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { LuBriefcase } from 'react-icons/lu';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['JobSeeker', 'Employer']),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role');

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'JobSeeker'
        }
    });

    useEffect(() => {
        if (roleParam === 'employer') {
            setValue('role', 'Employer');
        }
    }, [roleParam, setValue]);

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/auth/register', data);
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-8 border border-gray-200">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                        <input
                            {...register('fullName')}
                            type="text"
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange focus:border-orange sm:text-sm text-charcoal"
                        />
                        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                    <div className="mt-1">
                        <input
                            {...register('email')}
                            type="email"
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange focus:border-orange sm:text-sm text-charcoal"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1">
                        <input
                            {...register('password')}
                            type="password"
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange focus:border-orange sm:text-sm text-charcoal"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">I am a</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-orange">
                            <input
                                {...register('role')}
                                type="radio"
                                value="JobSeeker"
                                className="sr-only"
                            />
                            <span className="text-sm font-medium text-charcoal">Job Seeker</span>
                        </label>
                        <label className="flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-orange">
                            <input
                                {...register('role')}
                                type="radio"
                                value="Employer"
                                className="sr-only"
                            />
                            <span className="text-sm font-medium text-charcoal">Employer</span>
                        </label>
                    </div>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>

                <div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange hover:bg-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange disabled:opacity-50"
                    >
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-warmwhite flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <LuBriefcase className="h-12 w-12 text-orange" />
                </div>
                <h1 className="mt-6 text-center text-3xl font-extrabold text-charcoal">
                    Create an account
                </h1>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-orange hover:text-orange">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Suspense fallback={<div className="bg-white py-8 px-6 shadow-sm rounded-lg sm:px-8 border border-gray-200 text-center text-gray-500">Loading registration form...</div>}>
                    <RegisterContent />
                </Suspense>
            </div>
        </div>
    );
}
