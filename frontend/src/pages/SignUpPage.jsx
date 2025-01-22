import React from 'react'

const SignUpPage = () => {
  return (
    <div>
        <h2 className='text-green-500 text-5xl text-center'>Create your account</h2>
        <form>
            <div>
            <label htmlFor='username'>Full Name</label>
            <input type='text' id='username' name='username' />
            </div>
            <div>
            <label htmlFor='email'>Email</label>
            <input type='email' id='email' name='email' />
            </div>
            <div>
            <label htmlFor='password'>Password</label>
            <input type='password' id='password' name='password' />
            </div>
            <button type='submit'>Sign Up</button>
        </form>
    </div>
  )
}

export default SignUpPage