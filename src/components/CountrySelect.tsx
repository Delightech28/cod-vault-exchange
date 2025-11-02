import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import countries from 'world-countries';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);

  const countryList = countries
    .map((country) => ({
      value: country.name.common,
      label: country.name.common,
      flag: country.flag,
      code: country.cca2,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background hover:bg-accent"
        >
          {value ? (
            <span className="flex items-center gap-2">
              <span className="text-xl">
                {countryList.find((country) => country.value === value)?.flag}
              </span>
              {countryList.find((country) => country.value === value)?.label}
            </span>
          ) : (
            <span className="text-muted-foreground">Select country...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50 border" align="start">
        <Command className="bg-popover">
          <CommandInput placeholder="Search country..." className="bg-popover border-none" />
          <CommandList className="bg-popover">
            <CommandEmpty className="bg-popover">No country found.</CommandEmpty>
            <CommandGroup className="bg-popover">
              {countryList.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-accent data-[selected=true]:bg-accent"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === country.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="text-xl mr-2">{country.flag}</span>
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
