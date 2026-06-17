<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tahfiz Management System - Register</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Montserrat', sans-serif;
        }

        .bg-custom-green {
            background-color: #6EB2AD;
        }

        .text-custom-green {
            color: #00A18A;
        }
    </style>
</head>

<body class="flex min-h-screen bg-custom-green items-center justify-center p-6">
    <div class="w-full max-w-lg bg-white rounded-[40px] p-8 md:p-12 shadow-2xl">
        <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-[#2E3A59] mb-2 uppercase tracking-wide">REGISTER</h2>
            <p class="text-gray-500 text-sm">Create your account</p>
        </div>

        <form action="/register" method="POST">
            @csrf
            <div class="space-y-4 mb-6">
                <input type="text" name="name" placeholder="Full Name" required
                    class="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-custom-green"
                    value="{{ old('name') }}">
                <input type="email" name="email" placeholder="Email Address" required
                    class="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-custom-green"
                    value="{{ old('email') }}">

                <select name="role" required
                    class="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-custom-green">
                    <option value="" disabled selected>Select Role</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                    <option value="parent">👪 Parent</option>
                </select>

                <input type="password" name="password" placeholder="Password" required
                    class="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-custom-green">
                <input type="password" name="password_confirmation" placeholder="Confirm Password" required
                    class="w-full p-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-custom-green">
            </div>

            @if ($errors->any())
                <div class="mb-4 text-red-500 text-sm">
                    <ul class="list-disc list-inside">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <button type="submit"
                class="w-full py-4 bg-[#4A4A4A] text-white rounded-xl font-bold text-lg uppercase tracking-widest hover:bg-[#333] transition-colors shadow-lg">
                REGISTER
            </button>

            <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                <p class="text-gray-500 text-sm italic">
                    Already have an account? <a href="/login"
                        class="font-bold text-[#2E3A59] not-italic underline">Login here</a>
                </p>
            </div>
        </form>
    </div>
</body>

</html>