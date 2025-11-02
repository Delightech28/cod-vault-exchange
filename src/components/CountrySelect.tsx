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
import { getCountry } from 'countries-and-timezones';

interface CountrySelectProps {
  value: string;
  onChange: (value: string, timezone: string) => void;
}

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false);

  const countryList = countries
    .map((country) => {
      // Get timezone for this country
      const countryTimezones = getCountry(country.cca2);
      const primaryTimezone = countryTimezones?.timezones?.[0] || 'UTC';
      
      return {
        value: country.name.common,
        label: country.name.common,
        flag: getFlagEmoji(country.cca2),
        code: country.cca2,
        timezone: primaryTimezone,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const selectedCountry = countryList.find((country) => country.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background hover:bg-accent"
        >
          {value && selectedCountry ? (
            <span className="flex items-center gap-2">
              <span className="text-2xl leading-none">{selectedCountry.flag}</span>
              <span>{selectedCountry.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select country...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50 border shadow-lg" align="start">
        <Command className="bg-popover">
          <CommandInput placeholder="Search country..." className="bg-popover border-none" />
          <CommandList className="bg-popover max-h-[300px]">
            <CommandEmpty className="bg-popover py-6 text-center text-sm">No country found.</CommandEmpty>
            <CommandGroup className="bg-popover">
              {countryList.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.value}
                  onSelect={() => {
                    onChange(country.value, country.timezone);
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
                  <span className="text-2xl mr-2 leading-none">{country.flag}</span>
                  <span>{country.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
