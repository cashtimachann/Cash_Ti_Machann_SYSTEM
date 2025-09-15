import { COUNTRY_CODES, formatPhoneNumber, validatePhoneNumber } from '../../utils/countryCodes'

export default function TestCountryCodes() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Country Codes</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Countries:</h2>
        
        {COUNTRY_CODES.map((country) => (
          <div key={country.code} className="border p-4 rounded">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{country.flag}</span>
              <div>
                <p className="font-semibold">{country.nameKreol} ({country.name})</p>
                <p className="text-sm text-gray-600">{country.dialCode}</p>
                {country.areaCodes && (
                  <p className="text-xs text-gray-500">
                    Area codes: {country.areaCodes.slice(0, 5).join(', ')}
                    {country.areaCodes.length > 5 && '...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Test Phone Formatting:</h2>
          <div className="space-y-2">
            <p>Haiti: {formatPhoneNumber('HT', '+50934567890')}</p>
            <p>US: {formatPhoneNumber('US', '3051234567')}</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Test Phone Validation:</h2>
          <div className="space-y-2">
            <p>Haiti 34567890: {validatePhoneNumber('HT', '34567890') ? '✅ Valid' : '❌ Invalid'}</p>
            <p>Haiti 12345678: {validatePhoneNumber('HT', '12345678') ? '✅ Valid' : '❌ Invalid'}</p>
            <p>US 3051234567: {validatePhoneNumber('US', '3051234567') ? '✅ Valid' : '❌ Invalid'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
