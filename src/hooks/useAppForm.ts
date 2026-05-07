import { useForm as useRHF, type DefaultValues, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, z } from 'zod';

export function useAppForm<TSchema extends ZodSchema>(
  schema: TSchema,
  defaultValues?: DefaultValues<z.infer<TSchema>>,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver' | 'defaultValues'>
) {
  return useRHF<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
    ...options,
  });
}
