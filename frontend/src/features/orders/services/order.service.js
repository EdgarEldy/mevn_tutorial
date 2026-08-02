import { useToast } from 'vue-toastification'
import graphqlService from '@/services/graphql.service'

const toast = useToast()

const ORDER_FIELDS = `
  id
  quantity
  total
  createdAt
  customer { id first_name last_name }
  product { id product_name unit_price }
`

const ORDERS_QUERY = `query Orders { orders { ${ORDER_FIELDS} } }`
const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { ${ORDER_FIELDS} } }
`
const UPDATE_ORDER_MUTATION = `
  mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) { updateOrder(id: $id, input: $input) { ${ORDER_FIELDS} } }
`
const DELETE_ORDER_MUTATION = 'mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }'

function extractErrorMessage(error) {
  return error.message || 'Something went wrong. Please try again.'
}

async function getAll() {
  try {
    const data = await graphqlService.request(ORDERS_QUERY)
    return data.orders ?? []
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function create(input) {
  try {
    const data = await graphqlService.request(CREATE_ORDER_MUTATION, { input })
    toast.success('Order created.')
    return data.createOrder
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function update(id, input) {
  try {
    const data = await graphqlService.request(UPDATE_ORDER_MUTATION, { id, input })
    toast.success('Order updated.')
    return data.updateOrder
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function remove(id) {
  try {
    await graphqlService.request(DELETE_ORDER_MUTATION, { id })
    toast.success('Order deleted.')
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

export default { getAll, create, update, remove }
