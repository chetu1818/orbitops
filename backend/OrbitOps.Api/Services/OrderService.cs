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
            return _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
        }

        public List<Order> GetOrdersForEngineer(string engineerName)
        {
            return _context.Orders
                .Where(o => o.EngineerName.ToLower() == engineerName.ToLower())
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
        }

        public Order CreateOrder(Order order)
        {
            order.Id = $"ORD-{new Random().Next(1000, 9999)}";
            order.CreatedAt = DateTime.UtcNow;

            _context.Orders.Add(order);
            _context.SaveChanges();

            return order;
        }

        public List<Order> GetPendingOrders()
        {
            return _context.Orders
                .Where(o => o.Status == "Awaiting Admin Review")
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
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
