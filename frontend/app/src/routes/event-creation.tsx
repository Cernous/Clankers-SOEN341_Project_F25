import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/event-creation')({
  component: RouteComponent,
})


function RouteComponent() {
  return <main className="mx-auto max-w-7xl px-4 py-8">

        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Event Creation</h1>
          <p className="mt-1 text-neutral-600">
            Create your event
          </p>
        </header>

        <form>
        <div className="mb-5" >
        <label htmlFor="title" className="text-neutral-600 block font-bold">Title</label>
        
        <input
        type="text"
        placeholder="Title"
        className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
        />
        </div>

        <div className="mb-5" >
        <label htmlFor="description" className="text-neutral-600 block font-bold">Description</label>
        
        <textarea
        placeholder="Description"
        className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400">
        </textarea>
        </div>

        <div className="mb-5" >
        <label className="text-neutral-600 block font-bold">Event Time</label>

        <input
        type="datetime-local"
        className="rounded-xl border border-neutral-300 px-3 py-2"
        aria-label="Date"
      />
        </div>

        <div className="mb-5" >
        <label htmlFor="location" className="text-neutral-600 block font-bold">Location</label>
        
        <input
        type="text"
        placeholder="Location"
        className="min-w-[500px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
        />
        </div>

        <div className="mb-5" >
        <label htmlFor="capacity" className="text-neutral-600 block font-bold">Ticket Capacity</label>
        
        <input
        type="number"
        placeholder="Ticket Capacity"
        className="min-w-[243px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400"
        />
        </div>

        <div className="mb-5" >
        <label htmlFor="ticket_type" className="text-neutral-600 block font-bold">Ticket Type</label>
        
        <select name="ticket_type" id="ticket_type"
        className="min-w-[200px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-400">
        <option value="">--Please choose an option--</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
        </select>
        </div>

        <div className="mb-5" >
        <label htmlFor="recurring" className="text-neutral-600 block font-bold">Recurring</label>
        
        <div>
        <input type="radio" id="yes" name="recurring" value="yes" checked />
        <label htmlFor="yes"> yes</label>
        </div>

        <div>
        <input type="radio" id="no" name="recurring" value="no" checked />
        <label htmlFor="no"> no</label>
        </div>


        </div>

        <div>
        <button
        
        className="rounded-full bg-black px-4 py-1 text-sm font-medium text-white hover:bg-neutral-900">
        Create
        </button>
        </div>

         </form>
      </main>
}


