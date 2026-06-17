<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $prefix = $this->faker->randomElement(['Murabbi', 'Murabbiah']);
        $name = $prefix . ' ' . $this->faker->name();

        return [
            'name' => $name,
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'specialization' => $this->faker->randomElement([
                'Hafazan Al-Quran',
                'Tajwid & Tarmim',
                'Tafsir Al-Quran',
                'Qiraat Sab\'ah',
                'Bahasa Arab',
                'Ulum Al-Quran',
                'Fardu Ain & Akhlak'
            ]),
            'status' => $this->faker->randomElement(['Aktif', 'Tidak Aktif']),
            'joined_date' => $this->faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
        ];
    }
}
