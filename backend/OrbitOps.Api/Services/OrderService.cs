using System;
using System.Collections.Generic;
using System.Linq;
using OrbitOps.Api.Data;
using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services
{
    public interface IOrderService
    {
        List<Order> GetOrdersForUser(string userId);
        List<Order> GetOrdersForEngineer(string engineerName);
        Order CreateOrder(Order order);
        List<Order> GetPendingOrders();
        List<Order> GetAllOrders();
        bool UpdateOrderStatus(string orderId, string status);
        bool ApproveOrderCosting(string orderId, decimal price, string estimatedCompletionTime);
        bool ClientApproveCosting(string orderId);
        bool ClientDeclineCosting(string orderId);
        bool ClientCounterCosting(string orderId, decimal counterPrice);
        Order? CompleteOrderPayment(string orderId);
    }

    public class OrderService : IOrderService
    {
        private readonly OrbitOpsDbContext _context;

        public OrderService(OrbitOpsDbContext context)
        {
            _context = context;
        }

        public List<Order> GetOrdersForUser(string userId)
        {
            var list = _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
            PopulateClientDetails(list);
            return list;
        }

        public List<Order> GetOrdersForEngineer(string engineerName)
        {
            var list = _context.Orders
                .Where(o => o.EngineerName.ToLower() == engineerName.ToLower())
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
            PopulateClientDetails(list);
            return list;
        }

        public Order CreateOrder(Order order)
        {
            order.Id = $"ORD-{new Random().Next(1000, 9999)}";
            order.CreatedAt = DateTime.UtcNow;

            _context.Orders.Add(order);
            _context.SaveChanges();

            var user = _context.Users.FirstOrDefault(u => u.Id == order.UserId);
            if (user != null)
            {
                order.ClientName = user.Name;
                order.ClientCompany = user.Company;
                order.ClientEmail = user.Email;
            }

            return order;
        }

        public List<Order> GetPendingOrders()
        {
            var list = _context.Orders
                .Where(o => o.Status == "Awaiting Admin Review")
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
            PopulateClientDetails(list);
            return list;
        }

        public List<Order> GetAllOrders()
        {
            var list = _context.Orders
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
            PopulateClientDetails(list);
            return list;
        }

        public bool UpdateOrderStatus(string orderId, string status)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null) return false;

            order.Status = status;
            _context.SaveChanges();
            return true;
        }

        private void PopulateClientDetails(List<Order> orders)
        {
            if (orders == null || !orders.Any()) return;
            var userIds = orders.Select(o => o.UserId).Distinct().ToList();
            var users = _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionary(u => u.Id);
            foreach (var o in orders)
            {
                if (users.TryGetValue(o.UserId, out var user))
                {
                    o.ClientName = user.Name;
                    o.ClientCompany = user.Company;
                    o.ClientEmail = user.Email;
                }
            }
        }

        public bool ApproveOrderCosting(string orderId, decimal price, string estimatedCompletionTime)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null) return false;

            order.Price = price;
            order.EstimatedCompletionTime = estimatedCompletionTime;
            order.Status = "Cost Proposed by Admin";

            _context.SaveChanges();
            return true;
        }

        public bool ClientApproveCosting(string orderId)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null || order.Status != "Cost Proposed by Admin") return false;

            order.Status = "Awaiting Payment";
            _context.SaveChanges();
            return true;
        }

        public bool ClientDeclineCosting(string orderId)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null || order.Status != "Cost Proposed by Admin") return false;

            order.Status = "Declined";
            _context.SaveChanges();
            return true;
        }

        public bool ClientCounterCosting(string orderId, decimal counterPrice)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null || order.Status != "Cost Proposed by Admin") return false;

            order.Price = counterPrice;
            order.Status = "Awaiting Admin Review";
            _context.SaveChanges();
            return true;
        }

        public Order? CompleteOrderPayment(string orderId)
        {
            var order = _context.Orders.FirstOrDefault(o => o.Id == orderId);
            if (order == null || order.Status != "Awaiting Payment") return null;

            order.Status = "Awaiting Assignment";
            _context.SaveChanges();
            return order;
        }
    }
}
