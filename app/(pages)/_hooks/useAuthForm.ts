'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';

interface FieldValues {
  [key: string]: string;
}

interface FieldErrors {
  [key: string]: string;
}

interface AuthFormOptions {
  initialValues?: FieldValues;
  onSubmit?: (
    values: FieldValues
  ) => Promise<{ ok: boolean; body: string | null; error: string | null }>;
  onSuccess?: () => void;
}

interface AuthFormReturn {
  fields: FieldValues;
  errors: FieldErrors;
  loading: boolean;
  valid: boolean;
  setFieldValue: (field: string, value: any) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldError: (field: string, error: string) => void;
}

const validators = {
  email: (value: string) => {
    if (!value) return '';
    const emailValid = /\S+@\S+\.\S+/.test(value);
    if (!emailValid) {
      return 'Invalid email format';
    }
    return null;
  },
  password: (value: string) => {
    if (!value) return '';
    if (value.length < 6 || value.length > 20) {
      return 'Password must be between 6 and 20 characters.';
    }
    return null;
  },
  passwordDupe: (value: string, allValues: any) => {
    if (!value) return '';
    if (value !== allValues.password) {
      return "Passwords don't match.";
    }
    return null;
  },
  code: (value: string) => {
    if (!value) return '';
    return null;
  },
};

export default function useAuthForm(
  options: AuthFormOptions = {}
): AuthFormReturn {
  const { initialValues = {}, onSubmit, onSuccess } = options;

  const [fields, setFields] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  const setFieldValue = (field: string, value: any) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const setFieldError = (field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldValue(name, value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (onSubmit && onSuccess) {
        const result = await onSubmit(fields);

        if (!result.ok) {
          throw new Error(result.error ?? 'Error submitting form.');
        }

        onSuccess();
      } else {
        throw new Error('No submit function specified');
      }
    } catch (e) {
      const error = e as Error;
      setFieldError('submit', error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (formValues: FieldValues): FieldErrors | null => {
    const newErrors: FieldErrors = {};
    let allEmpty = true;

    Object.entries(validators).forEach(([field, validator]) => {
      const value = formValues[field];
      const error = validator(value, formValues);
      if (error !== '') allEmpty = false;
      if (error) newErrors[field] = error;
    });

    return allEmpty ? null : newErrors;
  };

  useEffect(() => {
    const newErrors = validateForm(fields);
    if (!newErrors) {
      setValid(false);
    } else {
      setErrors(newErrors);
      setValid(Object.keys(newErrors).length === 0);
    }
  }, [fields]);

  return {
    fields,
    errors,
    loading,
    valid,
    setFieldValue,
    setFieldError,
    handleChange,
    handleSubmit,
  };
}
